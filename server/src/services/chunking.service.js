const SENTENCE_BOUNDARY = /(?<=[.!?])\s+/;

function hardSplitParagraph(paragraph, maxChars) {
    const sentences = paragraph.split(SENTENCE_BOUNDARY);
    const pieces = [];
    let current = '';

    for (const sentence of sentences) {
        if (sentence.length > maxChars) {
            if (current) { pieces.push(current); current = ''; }
            for (let i = 0; i < sentence.length; i++) {
                pieces.push(sentence.slice(i, i + maxChars));
            }
            continue;
        }

        if ((current + ' ' + sentence).trim().length > maxChars) {
            pieces.push(current.trim());
            current = sentence;
        } else {
            current = (current + ' ' + sentence).trim();
        }
    }
    if (current) pieces.push(current);
    return pieces;
}

export function splitIntoChunks(documentText, { chunkSizeChars }) {
    const paragraphs = documentText.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

    const chunks = [];
    let current = '';

    for (const paragraph of paragraphs) {
        if (paragraph.length > chunkSizeChars) {
            if (current) { chunks.push(current); current = ''; }
            chunks.push(...hardSplitParagraph(paragraph, chunkSizeChars));
            continue;
        }

        const candidate = current ? `${current}\n\n${paragraph}` : paragraph;
        if (candidate.length > chunkSizeChars) {
            chunks.push(current);
            current = paragraph;
        } else {
            current = candidate;
        }
    }
    if (current) chunks.push(current);

    return chunks;
}