// File: apps/backend/src/server.js

'use strict';

require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { PrismaClient } = require('@prisma/client');
const { prismaErrorHandler, globalErrorHandler } = require('./middleware/errorHandler');

// ─── Prisma Singleton ───────────────────────────────────────────────────────
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
});

// ─── Express App ────────────────────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

// ─── CORS Configuration ─────────────────────────────────────────────────────
const allowedOrigins = ['*'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, curl, Postman)
    if (true) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: Origin "${origin}" not allowed.`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

// ─── Socket.io Server ───────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: corsOptions,
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
    skipMiddlewares: true,
  },
});

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors(corsOptions));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Attach io and prisma to every request for use in route handlers
app.use((req, _res, next) => {
  req.io = io;
  req.prisma = prisma;
  next();
});

// ─── Routes ─────────────────────────────────────────────────────────────────
const apiRouter = require('./routes/api');
const authRouter = require('./routes/auth');
const categoryRouter = require('./routes/categories');
const qrRouter = require('./routes/qr');

// Rate limiter — max 120 req/min per IP on API routes
const rateLimit = require('express-rate-limit');
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Terlalu banyak permintaan. Coba lagi dalam 1 menit.' },
});

app.use('/api', apiLimiter);
app.use('/api/auth', authRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/qr', qrRouter);
app.use('/api', apiRouter);

// ─── Health Check ───────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ─── 404 Handler ────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found.` });
});

// ─── Error Handlers (order matters) ─────────────────────────────────────────
app.use(prismaErrorHandler);
app.use(globalErrorHandler);

// ─── Socket.io Event Handlers ───────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // Cashier joins a dedicated room to receive order notifications
  socket.on('join:cashier', () => {
    socket.join('cashier-room');
    console.log(`[Socket.io] ${socket.id} joined cashier-room`);
  });

  // Customer joins room keyed by their table number
  socket.on('join:table', (tableId) => {
    const room = `table-${tableId}`;
    socket.join(room);
    console.log(`[Socket.io] ${socket.id} joined ${room}`);
  });

  socket.on('disconnect', (reason) => {
    console.log(`[Socket.io] Client disconnected: ${socket.id} — Reason: ${reason}`);
  });
});

// ─── Graceful Shutdown ───────────────────────────────────────────────────────
const shutdown = async (signal) => {
  console.log(`\n[Server] ${signal} received. Shutting down gracefully…`);
  await prisma.$disconnect();
  httpServer.close(() => {
    console.log('[Server] HTTP server closed.');
    process.exit(0);
  });
  // Force exit after 10 s if server hasn't closed
  setTimeout(() => process.exit(1), 10_000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Start ───────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);

const start = async () => {
  try {
    await prisma.$connect();
    console.log('[Prisma] Database connection established.');

    httpServer.listen(PORT, () => {
      console.log(`[Server] Kedai TehYan backend running on http://localhost:${PORT}`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('[Server] Failed to start:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

if (process.env.VERCEL) {
  module.exports = app;
} else {
  start();
  module.exports = { app, io, prisma };
}

