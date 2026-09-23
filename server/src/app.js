import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import apiRouter from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';


export function createApp() {
    const app = express();

    app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());

    app.use('/api/v1', apiRouter);

    app.use(notFoundHandler);

    app.use(errorHandler);

    return app;
}