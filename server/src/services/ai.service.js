import { CHUNKING_CONFIG, ERROR_CODES } from "../config/constants.js";
import { AppError } from "../utils/AppError.js";
import { logger } from "../utils/logger.js";
import { sleep, withRetry } from "../utils/retry.js";
import { loadCategoryPrompt, loadCategoryTemplate, loadSystemPrompt, loadUniversalRules } from "./promptLoader.service.js";

let client = null;

function getClient() {
    if (!client) {
        if (!process.env.GEMINI_API_KEY) {
            throw new AppError(
                ERROR_CODES.INTERNAL_SERVER_ERROR,
                'GEMINI_API_KEY is not configured on the server.',
            );
        }
        client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return client;
}

function sectionAppliesAtLength(section, summaryLength) {
    if (section.required) return true;
    const tier = section.tier || 'medium';
    if (tier === 'medium') return summaryLength === 'medium' || summaryLength === 'long';
    if (tier === 'long') return summaryLength === 'long';
    return false;
}

function buildOutputInstructions(template, summaryLength) {
    const activeSections = template.sections.filter((s) => sectionAppliesAtLength(s, summaryLength));

    const sectionList = activeSections.map((s) => `- id: "${s.id}", title: "${s.title}"${s.required ? ' (required)' : ' (optional — omit if the document has nothing to say here)'}`).join('\n');

    return `## Required Output Structure
 
    Return a single JSON object with this exact shape:
    
    {
    "title": "<the document's title, extracted from the text>",
    "author": "<the document's author, extracted from the text, or empty string if not stated>",
    "category": "${template.category}",
    "summaryLength": "${summaryLength}",
    "sections": [
        { "id": "<section id>", "title": "<section title>", "content": "<the actual summary content for this section>" }
    ]
    }
    
    Include exactly these sections, in exactly this order, using exactly these ids:
    ${sectionList}
    
    Do not include any section id not listed above. Do not reorder them. Omit an
    optional section entirely (don't include it in the "sections" array at all)
    if the document has nothing substantive to say for it — never include it
    with empty or placeholder content.`.trim();
}

async function assemblePrompt({ category, summaryLength, documentText }) {
    const [systemPrompt, universalRules, categoryPrompt, template] = await Promise.all([
        loadSystemPrompt(), 
        loadUniversalRules(), 
        loadCategoryPrompt(category), 
        loadCategoryTemplate(category)
    ]);

    const outputInstructions = buildOutputInstructions(template, summaryLength);

    const systemInstruction = [systemPrompt, universalRules, categoryPrompt].join('\n\n---\n\n');

    const userPrompt = `${outputInstructions} 
    
    ## Document Text
    
    ${documentText}`;

    return { systemInstruction, userPrompt, template };
}

// --- API call (the ONLY function in the app that talks to Gemini) -------
async function callGeminiApi({ systemInstruction, userPrompt, jsonMode = true }) {
    const ai = getClient();

    try {
      await ai.models.generateContent({
        model: AI_CONFIG.MODEL,
        contents: userPrompt,
        config: {
            systemInstruction,
            ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
        },
      });
      
      const text = response.text;
      if (!text) {
        throw new AppError(ERROR_CODES.SUMMARY_GENERATION_FAILED, 'The AI returned an empty response.');
      }
      return text;
    } catch (err) {
        if (err instanceof AppError) throw err;

        logger.error('Gemini API call failed', { message: err.message });

        const status = err.status || err.code;
        if (status === 429 || /rate limit|quota/i.test(err.message || '')) {
            throw new AppError(ERROR_CODES.AI_TIMEOUT, 'The AI provider is rate-limited. Please try again shortly.');
        }

        throw new AppError(ERROR_CODES.SUMMARY_GENERATION_FAILED, 'Failed to generate summary from the AI provider.');
    }
}

function parseJsonResponse(rawText) {
    // Defensive: even with responseMimeType:"application/json", strip stray
    // markdown fences in case a model variant ever wraps its output anyway.
    const cleaned = rawText.trim().replace(/^```json\s*/i, '').replace(/```$/, '').trim();

    try {
        return JSON.parse(cleaned);
    } catch {
        throw new AppError(
        ERROR_CODES.SUMMARY_GENERATION_FAILED,
        'The AI response was not valid JSON.',
        );
    }
}

function validateSummaryStructure(parsed, template, summaryLength) {
    if (!parsed || typeof parsed !== 'object') {
        throw new AppError(ERROR_CODES.SUMMARY_GENERATION_FAILED, 'AI response is not a JSON object.');
    }
    if (!Array.isArray(parsed.sections) || parsed.sections.length === 0) {
        throw new AppError(ERROR_CODES.SUMMARY_GENERATION_FAILED, 'AI response has no sections.');
    }

    const activeSections = template.sections.filter((s) => sectionAppliesAtLength(s, summaryLength));
    const validIds = new Set(activeSections.map((s) => s.id));
    const requiredIds = activeSections.filter((s) => s.required).map((s) => s.id);
    const expectedOrder = activeSections.map((s) => s.id);

    const seenIds = new Set();
    const returnedIdsInOrder = [];

    for (const section of parsed.sections) {
        if (!section || typeof section.id !== 'string') {
            throw new AppError(ERROR_CODES.SUMMARY_GENERATION_FAILED, 'A section is missing a valid id.');
        }
        if (!validIds.has(section.id)) {
            throw new AppError(ERROR_CODES.SUMMARY_GENERATION_FAILED, `Unknown section id returned: "${section.id}".`);
        }
        if (seenIds.has(section.id)) {
            throw new AppError(ERROR_CODES.SUMMARY_GENERATION_FAILED, `Duplicate section id returned: "${section.id}".`);
        }
        if (!section.content || typeof section.content !== 'string' || section.content.trim().length < 10) {
            throw new AppError(ERROR_CODES.SUMMARY_GENERATION_FAILED, `Section "${section.id}" has empty or placeholder content.`);
        }
        seenIds.add(section.id);
        returnedIdsInOrder.push(section.id);
    }

    const missingRequired = requiredIds.filter((id) => !seenIds.has(id));
    if (missingRequired.length > 0) {
        throw new AppError(ERROR_CODES.SUMMARY_GENERATION_FAILED, `Missing required section(s): ${missingRequired.join(', ')}.`);
    }

    const expectedRelativeOrder = expectedOrder.filter((id) => returnedIdsInOrder.includes(id));
    const orderMatches = expectedRelativeOrder.every((id, i) => id === returnedIdsInOrder[i]);
    if (!orderMatches) {
        throw new AppError(ERROR_CODES.SUMMARY_GENERATION_FAILED, 'Sections were returned out of order.');
    }
}

async function generateSummaryFromText({ category, summaryLength, documentText }) {
    const { systemInstruction, userPrompt, template } = await assemblePrompt(category, summaryLength, documentText);

    const rawText = await callGeminiApi({ systemInstruction, userPrompt });
    const parsed = parseJsonResponse(rawText);

    try {
        validateSummaryStructure(parsed, template, summaryLength);
    } catch (validationError) {
        logger.warn('Summary validation failed, attempting one correction retry', { error: validationError.message });

        const correctionPrompt = `${userPrompt}
            
            ## Correction Required
            
            Your previous response failed validation for this reason: "${validationError.message}"
            Return a corrected JSON response that fixes this issue and still follows all
            instructions above exactly.`;
        
        const retryRawText = await callGeminiApi({ systemInstruction, userPrompt: correctionPrompt });
        const retryParsed = parseJsonResponse(retryRawText);
        validateSummaryStructure(retryParsed, template, summaryLength)

        return retryParsed;
    }

    return parsed;
}

// map step — condense one chunk, category-neutral
async function digestChunk(chunkText, chunkIndex, chunkTotal) {
    const [systemPrompt, universalRules, digestTemplate] = await Promise.all([
        loadSystemPrompt(),
        loadUniversalRules(),
        loadChunkDigestPrompt(),
    ]);

    const systemInstruction = [systemPrompt, universalRules].join('\n\n---\n\n');
    const userPrompt = digestTemplate.replace('{chunkIndex}', String(chunkIndex + 1)).replace('{chunkTotal}', String(chunkTotal)).replace('{chunkText}', chunkText);

    return callGeminiApi({ systemInstruction, userPrompt, jsonMode: false });
}

// Exposed with a `digestFn` override so the pacing/retry loop itself can be
// unit-tested with a fake, network-free digest function.
export async function mapChunksToDigests(chunks, { digestFn = digestChunk } = {}) {
    const digests = [];

    for (let i = 0; i < chunks.length; i++) {
        const digest = await withRetry(
            () => digestFn(chunks[i], i, chunks.length),
            {
                backoffMs: CHUNKING_CONFIG.RETRY_BACKOFF_MS,
                isRetryable: (err) => err.code === ERROR_CODES.AI_TIMEOUT,
                onRetry: ({ attempt, delay, error }) => {
                    logger.warn('Chunk digest failed, retrying', { chunkIndex: i, attempt, delay, error: error.message });
                },
            },
        );
        digests.push(digest);
        
        // Pace ourselves proactively; no need to wait after the last chunk.
        if (i < chunks.length - 1) await sleep(CHUNKING_CONFIG.CALL_DELAY_MS);
    }

    return digests;
}

// reduce step — combine digests into one knowledge base
export function reduceDigestsToKnowledgeBase(digests) {
    return digests.map((digest, i) => `[Section ${i + 1} of ${digests.length}]\n${digest}`).join('\n\n');
}

// full large-document pipeline
async function generateSummaryForLargeDocument({ category, summaryLength, documentText }) {
    const chunks = splitIntoChunks(documentText, { chunkSizeChars: CHUNKING_CONFIG.CHUNK_SIZE_CHARS });

    logger.info('Starting chunked map-reduce pipeline', { chunkCount: chunks.length, totalChars: documentText.length });

    let digests;
    try {
        digests = await mapChunksToDigests(chunks);
    } catch (err) {
        if (err instanceof AppError) throw err;
        throw new AppError(ERROR_CODES.CHUNK_PROCESSING_FAILED, 'Failed to process one or more sections of this large document.');
    }

    const knowledgeBase = reduceDigestsToKnowledgeBase(digests);

    const titlePageText = documentText.slice(0, AI_CONFIG.TITLE_EXTRACTION_CHARS);
    const finalInputText = `${titlePageText}\n\n---\n\n${knowledgeBase}`;

    return generateSummaryFromText({ category, summaryLength, documentText: finalInputText });
}

export { buildOutputInstructions, parseJsonResponse, validateSummaryStructure, assemblePrompt };

export async function generateSummary({ category, summaryLength, documentText }) {
  if (documentText.length > CHUNKING_CONFIG.MAX_DOCUMENT_CHARS) {
    throw new AppError(
      ERROR_CODES.DOCUMENT_TOO_LARGE_TO_PROCESS,
      `This document exceeds the maximum supported size of ${CHUNKING_CONFIG.MAX_DOCUMENT_CHARS.toLocaleString()} characters.`,
    );
  }

  if (documentText.length > AI_CONFIG.CHUNK_THRESHOLD_CHARS) {
    return generateSummaryForLargeDocument({ category, summaryLength, documentText });
  }

  return generateSummaryFromText({ category, summaryLength, documentText });
}