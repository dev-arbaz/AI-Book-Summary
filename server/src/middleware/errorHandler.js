import { ERROR_CODES } from "../config/constants.js";
import { logger } from "../utils/logger.js";
import { sendError } from "../utils/responseFormatter.js";

export function errorHandler(err, req, res, next) {
    if (err.isOperational) {
        logger.warn(err.message, { code: err.code, path: req.originalUrl });
        return sendError(res, {
            status: err.status,
            message: err.message,
            code: err.code,
            details: err.details
        });
    }

    logger.error('Unhandled error', { message: err.message, stack: err.stack, path: req.originalUrl });
    return sendError(res, {
        status: 500,
        message: 'An unexpected error occurred.',
        code: ERROR_CODES.INTERNAL_SERVER_ERROR,
    });
}

export function notFoundHandler(req, res) {
    return sendError(res, {
        status: 404,
        message: `Route not found: ${req.method} ${req.originalUrl}`,
        code: ERROR_CODES.NOT_FOUND
    });
}