import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import prisma from '../db';

const router = Router();

// GET /api/tickets - fetch all tickets sorted by newest first
router.get('/', requireAuth, async (req, res) => {
  try {
    const tickets = await prisma.ticket.findMany({
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        subject: true,
        senderName: true,
        senderEmail: true,
        status: true,
        createdAt: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });
    
    res.json(tickets);
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
