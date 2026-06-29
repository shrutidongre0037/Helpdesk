import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import prisma from '../db';
import { Role } from '../generated/prisma';
import { createUserSchema, updateUserSchema } from '@helpdesk/core';

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

  const { name, email, password, role } = validationResult.data;

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
      role: role as Role,
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
    where: {
      deletedAt: null
    },
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

router.put('/:id', requireAuth, async (req, res) => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden: Admins only' });
    return;
  }

  const id = req.params.id as string;
  const validationResult = updateUserSchema.safeParse(req.body);
  if (!validationResult.success) {
    res.status(400).json({ error: 'Invalid input', details: validationResult.error.issues });
    return;
  }

  const { name, email, password, role } = validationResult.data;

  // Check if email belongs to someone else
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser && existingUser.id !== id) {
    res.status(400).json({ error: 'Email already exists' });
    return;
  }

  const updateData: any = { name, email, role };
  
  if (password && password.trim().length > 0) {
    const { hashPassword } = await import("better-auth/crypto");
    const hashedPassword = await hashPassword(password);
    
    // Better Auth stores the password in the accounts table
    // We update the associated credential account
    await prisma.account.updateMany({
      where: {
        userId: id,
        providerId: 'credential'
      },
      data: {
        password: hashedPassword,
        accountId: email // Keep accountId in sync with email
      }
    });
  } else {
    // If we only updated the email, we should still update the accountId in the credential account
    await prisma.account.updateMany({
      where: {
        userId: id,
        providerId: 'credential'
      },
      data: {
        accountId: email
      }
    });
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
  });

  res.json({ id: updatedUser.id, name: updatedUser.name, email: updatedUser.email, role: updatedUser.role });
});

router.delete('/:id', requireAuth, async (req, res) => {
  if (req.user?.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden: Admins only' });
    return;
  }

  const id = req.params.id as string;

  const targetUser = await prisma.user.findUnique({ where: { id } });
  
  if (!targetUser) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (targetUser.role === 'ADMIN') {
    res.status(403).json({ error: 'Forbidden: Cannot delete an ADMIN user' });
    return;
  }

  // Revoke all active sessions so the user is immediately logged out
  await prisma.session.deleteMany({ where: { userId: id } });

  const deletedEmail = `deleted_${Date.now()}_${targetUser.email}`;

  // Unassign all tickets assigned to this user
  await prisma.ticket.updateMany({
    where: { assignedToId: id },
    data: { assignedToId: null }
  });

  // Soft delete the user and free up their email address
  await prisma.user.update({
    where: { id },
    data: { 
      deletedAt: new Date(),
      email: deletedEmail
    }
  });

  // Also update their Better Auth account ID to match so it doesn't conflict
  await prisma.account.updateMany({
    where: {
      userId: id,
      providerId: 'credential'
    },
    data: {
      accountId: deletedEmail
    }
  });

  res.json({ success: true, message: 'User deleted successfully' });
});

export default router;
