import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth';
import prisma from './db';
import { requireAuth } from './middleware/requireAuth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.all("/api/auth", toNodeHandler(auth));
app.all("/api/auth/*path", toNodeHandler(auth));

// Example of a protected route
app.get('/api/protected', requireAuth, (req, res) => {
  res.json({ 
    message: 'You have accessed a protected route!', 
    user: req.user 
  });
});


app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', engine: 'bun', db: 'connected' });
  } catch (error: any) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port} using Bun!`);
});
