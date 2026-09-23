import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';

const healthRoutes = Router();

healthRoutes.get('/health', getHealth);

export default healthRoutes;