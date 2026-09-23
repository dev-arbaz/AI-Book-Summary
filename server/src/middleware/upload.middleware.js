import multer from 'multer';
import { ERROR_CODES, UPLOAD_CONFIG } from '../config/constants.js';
import { AppError } from '../utils/AppError.js';

const storage = multer.memoryStorage();

function fileFilter(req, file, cb) {
    if (!UPLOAD_CONFIG.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        return cb(new AppError(ERROR_CODES.UNSUPPORTED_FORMAT, 'Only PDF files are supported.'));
    }
    return cb(null, true);
}

const upload = multer({
    storage, fileFilter, limits: { fileSize: UPLOAD_CONFIG.MAX_FILE_SIZE_MB * 1024 *1024 },
});

export function uploadSingleFile(fieldName) {
    const middleware = upload.single(fieldName);

    return (req, res, next) => {
        middleware(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return next(new AppError(
                        ERROR_CODES.FILE_TOO_LARGE,
                        `File exceeds the ${UPLOAD_CONFIG.MAX_FILE_SIZE_MB}MB limit.`
                    ));
                }
                return next(new AppError(ERROR_CODES.INVALID_FILE, err.message));
            }
            if (err) return next(err);

            if (!req.file) {
                return next(new AppError(ERROR_CODES.INVALID_FILE, 'No file was uploaded.'));
            }
            return next();
        });
    };
}