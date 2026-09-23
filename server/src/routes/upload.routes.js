import { Router } from "express";
import { uploadSingleFile } from "../middleware/upload.middleware.js";
import { uploadDocument } from "../controllers/upload.controller.js";

const uploadRouter = Router();

uploadRouter.post('/upload', uploadSingleFile('file'), uploadDocument);

export default uploadRouter;