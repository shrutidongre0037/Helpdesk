import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth';
import prisma from './db';
import { requireAuth } from './middleware/requireAuth';
import { Role } from './generated/prisma';
import usersRouter from './routes/users';
import webhooksRouter from './routes/webhooks';
import ticketsRouter from './routes/tickets';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Security headers
app.use(helmet());

// Rate limiting — production only (skipped in dev/test to avoid blocking Playwright)
if (process.env.NODE_ENV === 'production') {
  // Global limiter: 100 requests per 15 minutes per IP
  const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,  // Return rate limit info in RateLimit-* headers
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
  });

  // Strict limiter for auth routes: 10 requests per 15 minutes per IP
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many authentication attempts, please try again later.' },
  });

  app.use(globalLimiter);
  app.use('/api/auth', authLimiter);

  console.log('🛡️  Rate limiting enabled (production mode)');
}

// CORS — explicit allowlist, not wildcard
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
}));

// Payload size limit (DoS protection) - increased to 1mb for webhook payloads
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Better Auth — must come before JSON parsing for some routes
app.all('/api/auth', toNodeHandler(auth));
app.all('/api/auth/*path', toNodeHandler(auth));

// Public routes
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', engine: 'bun', db: 'connected' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// Protected routes
app.get('/api/protected', requireAuth, (req, res) => {
  res.json({ message: 'Protected route OK', user: req.user });
});

app.use('/api/users', usersRouter);
app.use('/api/webhooks', webhooksRouter);
app.use('/api/tickets', ticketsRouter);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
