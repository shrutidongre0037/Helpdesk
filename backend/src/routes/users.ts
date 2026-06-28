import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import prisma from '../db';
import { Role } from '../generated/prisma';
import { createUserSchema } from '@helpdesk/core';

const router = Router();

router.post('/', requireAuth, async (req, res) => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden: Admins only' });
    return;
  }

  const validationResult = createUserSchema.safeParse(req.body);
  if (!validationResult.success) {
    res.status(400).json({ error: 'Invalid input', details: validationResult.error.issues });
    return;
  }

  const { name, email, password } = validationResult.data;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    res.status(400).json({ error: 'Email already exists' });
    return;
  }

  const { hashPassword } = await import("better-auth/crypto");
  const crypto = await import("crypto");
  
  // Fallback to crypto.randomUUID if @better-auth/core/utils/id fails to import
  const userId = crypto.randomUUID();
  const accountId = crypto.randomUUID();

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      id: userId,
      name,
      email,
      emailVerified: false,
      role: Role.AGENT,
      createdAt: new Date(),
      updatedAt: new Date(),
      accounts: {
        create: {
          id: accountId,
          accountId: email,
          providerId: 'credential',
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }
    },
  });

  res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
});

router.get('/', requireAuth, async (req, res) => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden: Admins only' });
    return;
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  res.json(users);
});

export default router;
