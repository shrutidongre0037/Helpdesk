import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import prisma from '../db';

const router = Router();

// GET /api/tickets - fetch all tickets sorted by newest first (or custom sort)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { sort = 'createdAt', order = 'desc', status, search } = req.query;

    const validSortFields = ['createdAt', 'subject', 'status', 'senderName', 'senderEmail'];
    const sortBy = validSortFields.includes(sort as string) ? (sort as string) : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const whereClause: any = {};
    if (status && typeof status === 'string' && status !== 'ALL') {
      whereClause.status = status;
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      whereClause.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { senderName: { contains: search, mode: 'insensitive' } },
        { senderEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      orderBy: {
        [sortBy]: sortOrder,
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
