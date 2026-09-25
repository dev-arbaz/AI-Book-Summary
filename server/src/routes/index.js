import { Router } from "express";
import healthRoutes from "./health.routes.js";
import uploadRouter from "./upload.routes.js";
import summaryRoutes from "./summary.routes.js";

const router = Router();

router.use(healthRoutes);
router.use(uploadRouter);
router.use(summaryRoutes);

export default router;