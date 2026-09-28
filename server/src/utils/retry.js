export function sleep(ms) {
    new Promise((resolve) => setTimeout(resolve, ms));
}

// fn: () => Promise<T>
// isRetryable: (err) => boolean — decides whether to retry or fail immediately
// backoffMs: array of delays, one per retry attempt (length = max retries)

export async function withRetry(fn, { backoffMs = [], isRetryable = () => true, onRetry } = {}) {
    let lastError;

    for (let attempt = 0; attempt <= backoffMs.length; attempt += 1) {
        try {
            return await fn();
        } catch (err) {
            lastError = err;

            const isLastAttempt = attempt === backoffMs.length;
            if (isLastAttempt || !isRetryable(err)) {
                throw err;
            }

            const delay = backoffMs[attempt];
            if (onRetry) onRetry({ attempt: attempt + 1, delay, error: err });
            await sleep(delay);
        }
    }

    throw lastError;
}