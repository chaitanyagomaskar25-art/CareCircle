import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { corsOptions } from './config/cors.js';
import apiRouter from './routes/api.router.js';
import notFoundHandler from './middlewares/notFound.middleware.js';
import errorHandler from './middlewares/errorHandler.middleware.js';

const app = express();

// Security HTTP headers
app.use(helmet());

// CORS configuration
app.use(cors(corsOptions));

// Cookie Parser for secure cookie-based JWT sessions
app.use(cookieParser());

// HTTP Request Logger in development
if (env.isDevelopment) {
  app.use(morgan('dev'));
}

// Request body parsers
app.use(express.json({ limit: '32kb' }));
app.use(express.urlencoded({ extended: true, limit: '32kb' }));

// Quick root health alias
app.get('/health', (req, res) => res.redirect(`${env.API_PREFIX}/health`));

// Mount Modular API Router
app.use(env.API_PREFIX, apiRouter);

// Catch-all 404 handler for undefined routes
app.use(notFoundHandler);

// Centralized error handling middleware
app.use(errorHandler);

export default app;
