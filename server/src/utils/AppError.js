import { ERROR_CODE_STATUS_MAP, ERROR_CODES } from "../config/constants.js";

export class AppError extends Error {
    constructor(code, message, details = null) {
        super(message);
        this.name = 'AppError';
        this.code = code || ERROR_CODES.INTERNAL_SERVER_ERROR;
        this.status = ERROR_CODE_STATUS_MAP[this.code] || 500;
        this.details = details;
        this.isOperational = true;

        Error.captureStackTrace(this, this.constructor);
    }
}