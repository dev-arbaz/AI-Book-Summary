import 'dotenv/config';
import { createApp } from "./app.js";
import { DEFAULT_PORT } from "./config/constants.js";
import { logger } from "./utils/logger.js";
import { startDocumentStoreCleanup } from './services/documentstore.service.js';

const PORT = process.env.PORT || DEFAULT_PORT;

const app = createApp();

startDocumentStoreCleanup();

app.listen(PORT, () => {
    logger.info(`Server is running on port http://localhost:${PORT}`, { env: process.env.NODE_ENV || 'development' });
});