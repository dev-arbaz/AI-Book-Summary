export const ERROR_CODES = {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    RATE_LIMITED: 'TOO_MANY_REQUESTS',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    INVALID_FILE: 'INVALID_FILE',
    UNSUPPORTED_FORMAT: 'UNSUPPORTED_FORMAT',
    EMPTY_FILE: 'EMPTY_FILE',
    FILE_TOO_LARGE: 'FILE_TOO_LARGE',
    PDF_EXTRACTION_FAILED: 'PDF_EXTRACTION_FAILED',
    DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
    MISSING_FIELD: 'MISSING_FIELD',
    INVALID_CATEGORY: 'INVALID_CATEGORY',
    INVALID_SUMMARY_LENGTH: 'INVALID_SUMMARY_LENGTH',
    DOCUMENT_TOO_LARGE_TO_PROCESS: 'DOCUMENT_TOO_LARGE_TO_PROCESS',
    CHUNK_PROCESSING_FAILED: 'CHUNK_PROCESSING_FAILED',
    SUMMARY_GENERATION_FAILED: 'SUMMARY_GENERATION_FAILED',
    AI_TIMEOUT: 'AI_TIMEOUT',
};

export const ERROR_CODE_STATUS_MAP = {
    [ERROR_CODES.VALIDATION_ERROR]: 400,
    [ERROR_CODES.INVALID_FILE]: 400,
    [ERROR_CODES.UNAUTHORIZED]: 401,
    [ERROR_CODES.NOT_FOUND]: 404,
    [ERROR_CODES.DOCUMENT_NOT_FOUND]: 404,
    [ERROR_CODES.FILE_TOO_LARGE]: 413,
    [ERROR_CODES.UNSUPPORTED_FORMAT]: 415,
    [ERROR_CODES.UNSUPPORTED_FORMAT]: 415,
    [ERROR_CODES.EMPTY_FILE]: 422,
    [ERROR_CODES.PDF_EXTRACTION_FAILED]: 422,
    [ERROR_CODES.RATE_LIMITED]: 429,
    [ERROR_CODES.INTERNAL_SERVER_ERROR]: 500,
    [ERROR_CODES.SUMMARY_GENERATION_FAILED]: 500,
    [ERROR_CODES.CHUNK_PROCESSING_FAILED]: 500,
    [ERROR_CODES.AI_TIMEOUT]: 503,
};

export const UPLOAD_CONFIG = {
    MAX_FILE_SIZE_MB: Number(process.env.MAX_FILE_SIZE_MB) || 25,
    ALLOWED_MIME_TYPES: ['application/pdf'],
    DOCUMENT_TTL_MINUTES: Number(process.env.DOCUMENT_TTL_MINUTES) || 60
};

export const CATEGORIES = ['entrepreneur', 'student'];

export const SUMMARY_LENGTHS = ['short', 'medium', 'long'];

export const AI_CONFIG = {
    MODEL: process.env.GEMINI_MODEL || 'gemini-3.6-flash',

    CHUNK_THRESHOLD_CHARS: Number(process.env.CHUNK_THRESHOLD_CHARS) || 150000,

    TITLE_EXTRACTION_CHARS: Number(process.env.TITLE_EXTRACTION_CHARS) || 5000,
}

// (large document) - chuked map-reduce pipeline
function buildBackoffSchedule(maxRetries) {
    const base = [5000, 15000, 30000];
    const schedule = base.slice(0, maxRetries);
    while (schedule.length < maxRetries) {
        schedule.push(schedule[schedule.length - 1] * 2);
    }
    return schedule;
}

const CHUNK_MAX_RETRIES = Number(process.env.CHUNK_MAX_RETRIES) || 3;

export const CHUNKING_CONFIG = {
    // Deliberately LARGER than CHUNK_THRESHOLD_CHARS above. The constraint
    // driving chunk size isn't Gemini's context window (~1M tokens) — it's
    // minimizing the NUMBER of requests against free-tier requests-per-minute
    // limits. Bigger chunks = fewer calls. Measure your own provider's
    // actual RPM limit before assuming this number; don't guess.
    CHUNK_SIZE_CHARS: Number(process.env.CHUNK_SIZE_CHARS) || 180000,
    // Sleep between chunk-digest calls, proactively staying under rate
    // limits rather than firing fast and recovering from 429s after the fact.
    CALL_DELAY_MS: Number(process.env.CHUNK_CALL_DELAY_MS) || 7000,
    // Retry attempts per chunk on a retryable (rate-limit) failure, with
    // exponential backoff, before giving up loudly.
    MAX_RETRIES: CHUNK_MAX_RETRIES,
    RETRY_BACKOFF_MS: buildBackoffSchedule(CHUNK_MAX_RETRIES),
    // Absolute hard ceiling regardless of chunking — protects against a
    // pathological upload (e.g. a corrupted PDF that extracts as millions
    // of characters of garbage) turning into thousands of API calls.
    MAX_DOCUMENT_CHARS: Number(process.env.MAX_DOCUMENT_CHARS) || 2000000,
}

export const EXAMPLE_ENUM = {
    OPTION_A: 'option_a',
    OPTION_B: 'option_b'
};

export const DEFAULT_PORT = 4000;