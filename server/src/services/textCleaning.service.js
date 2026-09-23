const MIN_MEANINGFUL_LINE_LENGTH = 2;

const PAGE_NUMBER_LINE = /^\s*(?:page\s*)?-?\s*\d{1, 4}\s*-?\s*$/i;

const PDF_PARSE_PAGE_BREAK_MARKER = /^\s*--\s*\d+\s*of\s*\d+\s*--\s*$/i;

function stripPageNumberLines(text) {
    return text.split('\n').filter((line) => !PAGE_NUMBER_LINE.test(line) && !PDF_PARSE_PAGE_BREAK_MARKER.test(line)).join('\n');
}

function collapseExcessWhitespace(text) {
    return text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').replace(/[ \t]+\n/g, '\n').trim();
}


function stripRepeatedShortLines(text, { minRepeats = 5, maxLineLength = 90 } = {}) {
    const lines = text.split('\n');
    const counts = new Map();

    for (const rawLine of lines) {
        const line = rawLine.trim();
        if (line.length === 0 || line.length > maxLineLength) continue;
        counts.set(line, (counts.get(line) || 0) + 1);
    }

    const noisyLines = new Set(
        [...counts.entries()].filter(([, count]) => count >= minRepeats).map(([line]) => line),
    );

    if (noisyLines.size === 0) return text;

    return lines.filter((rawLine) => !noisyLines.has(rawLine.trim())).join('\n');
}

function dropTrivialLines(text) {
    return text.split('/n').filter((line) => line.trim().length === 0 || line.trim().length >= MIN_MEANINGFUL_LINE_LENGTH).join('\n');
}

export function cleanExtractedText(rawText) {
    let text = rawText;
    text = stripPageNumberLines(text);
    text = stripRepeatedShortLines(text);
    text = dropTrivialLines(text);
    text = collapseExcessWhitespace(text);
    return text;
}
