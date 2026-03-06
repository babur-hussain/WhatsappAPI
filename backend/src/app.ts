import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.config';
import { logger } from './config/logger';

import { createServer } from 'http';
import { initSocketServer } from './socket/socket.server';
import { initWorkers } from './config/workers';
import { factoryRateLimiter } from './config/redis';
import { globalErrorHandler } from './middlewares/error.middleware';

const app: Application = express();
const httpServer = createServer(app);

// Initialize Socket.io
initSocketServer(httpServer);

// Initialize BullMQ Workers for Background processing
initWorkers();

// Security Hardening
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGINS,
  credentials: true,
}));

// Request Logger
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path !== '/api/v1/health') {
    logger.info(`[REQ] ${req.method} ${req.url}`);
  }
  next();
});

// Apply global rate limiting for endpoints (except webhook potentially to ensure Meta delivery)
app.use('/api/', factoryRateLimiter);

// Body Parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

import routes from './routes/v1';

import prisma from './config/database';
import { redis } from './config/redis';

// Health Check Endpoint (For Load Balancers & Kubernetes)
app.get('/api/v1/health', async (req: Request, res: Response) => {
  try {
    // 1. Check DB Connectivity
    await prisma.$queryRaw`SELECT 1`;

    // 2. Check Redis Connectivity
    await redis.ping();

    res.status(200).json({
      status: 'UP',
      components: {
        database: 'UP',
        redis: 'UP'
      },
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    logger.error('Health Check Failed', error);
    res.status(503).json({
      status: 'DOWN',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.use('/api/v1', routes);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, error: { message: 'Route not found', code: 'NOT_FOUND' } });
});

// Global Error Handler
app.use(globalErrorHandler);

const SOCKET_PORT = env.SOCKET_PORT;

// Start both Express and Socket.IO on their respective ports, or same port if configured
httpServer.listen(SOCKET_PORT, () => {
  logger.info(`Socket.IO Server running on port ${SOCKET_PORT}`);
});

export default app;
