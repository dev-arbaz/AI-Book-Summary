function timestamp() {
    return new Date().toISOString();
}

function format(level, message, meta) {
    const base = `[${timestamp()}] [${level.toUpperCase()}] ${message}`;
    return meta && Object.keys(meta).length > 0 ? `${base} ${JSON.stringify(meta)}` : base;
}

export const logger = {
    info(message, meta = {}) {
        console.log(format('info', message, meta));
    },
    warn(message, meta = {}) {
        console.warn(format('warn', message, meta));
    },
    error(message, meta = {}) {
        console.error(format('error', message, meta));
    },
    debug(message, meta = {}) {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(format('debug', message, meta));
        }
    },
};