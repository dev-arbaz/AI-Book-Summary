import { saveDocument } from "../services/documentstore.service.js";
import { extractTextFromPdf } from "../services/pdf.service.js";
import { cleanExtractedText } from "../services/textCleaning.service.js";
import { logger } from "../utils/logger.js";
import { sendSuccess } from "../utils/responseFormatter.js";

export async function uploadDocument(req, res) {
    const { buffer, originalname } = req.file;

    const { text: rawText, pageCount } = await extractTextFromPdf(buffer);
    const cleanedText = cleanExtractedText(rawText);

    const documentId = saveDocument({
        text: cleanedText,
        pageCount,
        fileName: originalname,
    });

    logger.info('Document uploaded and processed', {
        documentId,
        pageCount,
        rawChars: rawText.length,
        cleanedChars: cleanedText.length,
    });

    return sendSuccess(res, {
        status: 201,
        message: 'PDF uploaded successfully.',
        data: {
            documentId,
            fileName: originalname,
            pages: pageCount,
            status: 'ready',
        },
    });
}