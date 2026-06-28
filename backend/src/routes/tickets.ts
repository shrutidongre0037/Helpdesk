import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth';
import prisma from '../db';

const router = Router();

// GET /api/tickets - fetch all tickets sorted by newest first (or custom sort)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { sort = 'createdAt', order = 'desc', status, search, page = '1', limit = '10' } = req.query;

    const validSortFields = ['createdAt', 'subject', 'status', 'senderName', 'senderEmail'];
    const sortBy = validSortFields.includes(sort as string) ? (sort as string) : 'createdAt';
    const sortOrder = order === 'asc' ? 'asc' : 'desc';

    const parsedPage = parseInt(page as string, 10) || 1;
    const parsedLimit = parseInt(limit as string, 10) || 10;
    const skip = (parsedPage - 1) * parsedLimit;

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

    const [total, tickets] = await prisma.$transaction([
      prisma.ticket.count({ where: whereClause }),
      prisma.ticket.findMany({
        where: whereClause,
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: parsedLimit,
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
      })
    ]);
    
    res.json({
      data: tickets,
      meta: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (error: any) {
    console.error('Error fetching tickets:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
