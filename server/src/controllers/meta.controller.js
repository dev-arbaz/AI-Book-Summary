import { sendSuccess } from '../utils/responseFormatter.js';
import { CATEGORIES, SUMMARY_LENGTHS } from '../config/constants.js';

export function getCategories(req, res) {
  return sendSuccess(res, { data: CATEGORIES });
}

export function getSummaryLengths(req, res) {
  return sendSuccess(res, { data: SUMMARY_LENGTHS });
}