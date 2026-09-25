import { CATEGORIES, ERROR_CODES, SUMMARY_LENGTHS } from "../config/constants";
import { generateSummary } from "../services/ai.service";
import { getDocument } from "../services/documentstore.service";
import { AppError } from "../utils/AppError";
import { logger } from "../utils/logger";
import { sendSuccess } from "../utils/responseFormatter";

export async function createSummary(req, res) {
    const { documentId, category, summaryLength = 'medium' } = req.body;

    if (!documentId || !category) {
        throw new AppError(ERROR_CODES.MISSING_FIELD, 'documentId and category are required.');
    }
    if (!CATEGORIES.includes(category)) {
        throw new AppError(ERROR_CODES.INVALID_CATEGORY, `category must be one of: ${CATEGORIES.join(', ')}.`);
    }
    if (!SUMMARY_LENGTHS.includes(summaryLength)) {
        throw new AppError(ERROR_CODES.INVALID_SUMMARY_LENGTH, `summaryLength must be one of: ${SUMMARY_LENGTHS.join(', ')}.`);
    }

    const document = getDocument(documentId);

    const summary = await generateSummary({
        category,
        summaryLength,
        documentText: document.text,
    });

    logger.info('Summary generated', { documentId, category, summaryLength, sections: summary.sections.length });

    return sendSuccess(res, {
        message: 'Summary generated successfully.',
        data: summary,
    });
}