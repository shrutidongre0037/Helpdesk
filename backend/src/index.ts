import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth';
import prisma from './db';
import { requireAuth } from './middleware/requireAuth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Security headers
app.use(helmet());

// CORS — explicit allowlist, not wildcard
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Payload size limit (DoS protection)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

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

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
