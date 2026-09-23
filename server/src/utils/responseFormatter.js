export function sendSuccess(res, { status = 200, message = 'Request completed successfully.', data = null, meta = {} } = {}) {
    return res.status(status).json({ success: true, message, data, meta });
}

export function sendError(res, { status = 500, message = 'Something went wrong.', code = 'INTERNAL_SERVER_ERROR', details = null } = {}) {
    return res.status(status).json({ success: false, message, error: { code, details } });
}