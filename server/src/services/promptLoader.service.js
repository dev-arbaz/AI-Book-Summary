import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../config/constants.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = path.join(__dirname, '..', 'prompts');
const TEMPLATES_DIR = path.join(__dirname, '..', 'templates');

const cache = new Map();

async function readCached(filePath, parser = (text) => text) {
    if (cache.has(filePath)) return cache.get(filePath);

    let raw;
    try {
        raw = await readFile(filePath, 'utf-8');
    } catch {
        throw new AppError(
            ERROR_CODES.INTERNAL_SERVER_ERROR,
            `Missing prompt/template file: ${path.basename(filePath)}. This is a server configuration bug, not a user error.`,
        );
    }

    const parsed = parser(raw);
    cache.set(filePath, parsed);
    return parsed;
}

export function loadSystemPrompt() {
  return readCached(path.join(PROMPTS_DIR, 'system.md'));
}
 
export function loadUniversalRules() {
  return readCached(path.join(PROMPTS_DIR, 'universal-rules.md'));
}
 
export function loadCategoryPrompt(category) {
  return readCached(path.join(PROMPTS_DIR, `${category}.md`));
}
 
export function loadChunkDigestPrompt() {
  return readCached(path.join(PROMPTS_DIR, 'chunk-digest.md'));
}
 
export function loadCategoryTemplate(category) {
  return readCached(path.join(TEMPLATES_DIR, `${category}.json`), (raw) => JSON.parse(raw));
}