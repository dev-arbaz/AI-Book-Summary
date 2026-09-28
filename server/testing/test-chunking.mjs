import { splitIntoChunks } from '../src/services/chunking.service.js';

// Build a realistic large synthetic document: many paragraphs, real sentences.
const paragraph = (n) =>
  `This is paragraph number ${n} of a synthetic test book. ` +
  `It contains multiple sentences to simulate real prose. ` +
  `Each sentence ends properly with punctuation. ` +
  `This helps verify that chunk boundaries never fall mid-sentence.`;

const paragraphs = [];

for (let i = 0; i < 2000; i++) {
  paragraphs.push(paragraph(i));
}

const bigDoc = paragraphs.join('\n\n');

console.log('Total document size:', bigDoc.length, 'chars');

const chunks = splitIntoChunks(bigDoc, {
  chunkSizeChars: 20000,
});

console.log('Number of chunks:', chunks.length);
console.log('Chunk sizes:', chunks.map((c) => c.length));

// Check 1: every chunk is under the limit.
const oversized = chunks.filter((chunk) => chunk.length > 20000);

console.log('Chunks exceeding limit:', oversized.length);

// Check 2: no chunk boundary falls mid-sentence.
// Every chunk except the final chunk should end in sentence-ending punctuation.
const midSentenceCuts = chunks
  .slice(0, -1)
  .filter((chunk) => !/[.!?]\s*$/.test(chunk.trim()));

console.log(
  'Chunks NOT ending on a sentence boundary:',
  midSentenceCuts.length
);

// Check 3: no data loss.
// Normalize whitespace because chunks may have been split at paragraph boundaries.
const rejoined = chunks.join(' ').replace(/\s+/g, ' ').trim();

const allParagraphsPresent = paragraphs.every((p) => {
  const normalizedParagraph = p.replace(/\s+/g, ' ').trim();
  return rejoined.includes(normalizedParagraph);
});

console.log(
  'All original paragraphs present after chunking:',
  allParagraphsPresent
);

// Optional: fail loudly when an invariant is broken.
if (oversized.length > 0) {
  throw new Error(`Found ${oversized.length} oversized chunk(s).`);
}

if (midSentenceCuts.length > 0) {
  throw new Error(
    `Found ${midSentenceCuts.length} chunk(s) ending mid-sentence.`
  );
}

if (!allParagraphsPresent) {
  throw new Error('Data loss detected: not all paragraphs survived chunking.');
}
