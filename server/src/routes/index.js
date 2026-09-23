import { Router } from "express";
import healthRoutes from "./health.routes.js";
import uploadRouter from "./upload.routes.js";

const router = Router();

router.use(healthRoutes);
router.use(uploadRouter);

export default router;