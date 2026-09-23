import { sendSuccess } from "../utils/responseFormatter.js";

export function getHealth(req, res) {
    return sendSuccess(res, {
        message: 'Service is healthy.',
        data: { status: 'ok' }
    });
}