import { Router } from 'express';
import { createSummary } from '../controllers/summary.controller.js';

const summaryRoutes = Router();

summaryRoutes.post('/generate-summary', createSummary);

export default summaryRoutes;