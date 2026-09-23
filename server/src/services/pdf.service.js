import { PDFParse } from 'pdf-parse';
import { AppError } from '../utils/AppError.js';
import { ERROR_CODES } from '../config/constants.js';
import { logger } from '../utils/logger.js';

export async function extractTextFromPdf(buffer) {
    let parser;
    try {
        parser = new PDFParse({ data: buffer });
        const result = await parser.getText();

        const text = (result.text || '').trim();
        if(!text) {
            throw new AppError(ERROR_CODES.EMPTY_FILE, 'The PDF contains no extractable text. Scanned/image-only PDFs are not supported yet.');
        }

        return { text, pageCount: result.total || 0 };
    } catch (err) {
        if (err instanceof AppError) throw err;

        logger.error('PDF extraction failed', { message: err.message });
        throw new AppError(
            ERROR_CODES.PDF_EXTRACTION_FAILED, 'Could not extract text from this PDF. It may be corrupted, password-protected, or in an unsupported format.',
        );
    } finally {
        if (parser) await parser.destroy().catch(() => {});
    }
}