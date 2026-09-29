import { Router } from 'express';

const metaRouter = Router();

metaRouter.get('/categories', getCategories);
metaRouter.get('/summary-lengths', getSummaryLengths);

export default metaRouter;
