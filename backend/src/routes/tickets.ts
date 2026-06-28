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

// GET /api/tickets/:id - fetch a single ticket by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Missing ticket ID' });
    }
    const ticketId = parseInt(id, 10);

    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error: any) {
    console.error('Error fetching ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PATCH /api/tickets/:id - update a ticket (e.g. assign to an agent)
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    // Only admins can assign tickets
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Only admins can update tickets' });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Missing ticket ID' });
    }
    const ticketId = parseInt(id, 10);

    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }

    const { assignedToId, status } = req.body;
    const dataToUpdate: any = {};

    if (assignedToId !== undefined) {
      if (assignedToId !== null) {
        const user = await prisma.user.findUnique({
          where: { id: assignedToId },
        });

        if (!user || user.deletedAt !== null) {
          return res.status(400).json({ error: 'Invalid or inactive user specified for assignment' });
        }
      }
      dataToUpdate.assignedToId = assignedToId;
    }

    if (status !== undefined) {
      const validStatuses = ['NEW', 'OPEN', 'PENDING', 'RESOLVED', 'CLOSED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid ticket status' });
      }
      dataToUpdate.status = status;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: dataToUpdate,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    res.json(ticket);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    console.error('Error updating ticket:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
