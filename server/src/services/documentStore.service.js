import { randomUUID } from 'node:crypto';
import { ERROR_CODES, UPLOAD_CONFIG } from "../config/constants.js";
import { AppError } from "../utils/AppError.js";
import { logger } from '../utils/logger.js';

const store = new Map();

const TTL_MS = UPLOAD_CONFIG.DOCUMENT_TTL_MINUTES * 60 *1000;

export function saveDocument({ text, pageCount, fileName}) {
    const documentId = randomUUID();
    store.set(documentId, { text, pageCount, fileName, createdAt: Date.now() });

    return documentId;
}

export function getDocument(documentId) {
    const doc = store.get(documentId);
    if (!doc) {
        throw new AppError(
            ERROR_CODES.DOCUMENT_NOT_FOUND, 'Document not found. It may have expired — please upload it again.',
        );
    }
    return doc;
}

export function deleteDocument(documentId) {
    store.delete(documentId);
}

function cleanupExpiredDocuments() {
    const now = Date.now();
    let removed = 0;
    for (const [id, doc] of store.entries()) {
        if (now - doc.createdAt > TTL_MS) {
            store.delete(id);
            removed += 1;
        }
    }
    if (removed > 0) {
        logger.info('Cleaned up expired documents', { removed, remaining: store.size });
    }
}

const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let cleanupTimer = null;

export function startDocumentStoreCleanup() {
    if (cleanupTimer) return;
    cleanupTimer = setInterval(cleanupExpiredDocuments, CLEANUP_INTERVAL_MS);
    cleanupTimer.unref(); // never keep the process alive on its own
}

// Exposed for tests/introspection only — not used by the app itself.
export function _debugStoreSize() {
    return store.size;
}