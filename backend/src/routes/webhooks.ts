import { Router } from 'express';
import prisma from '../db';
import { TicketStatus } from '../generated/prisma';
import { inboundEmailSchema } from '@helpdesk/core';


const router = Router();

router.post('/email', async (req, res) => {
  try {
    const parseResult = inboundEmailSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid payload', details: parseResult.error.format() });
      return;
    }

    const { from, fromName, subject, body } = parseResult.data;

    const ticket = await prisma.ticket.create({
      data: {
        senderEmail: from,
        senderName: fromName || null,
        subject,
        description: body,
        status: TicketStatus.NEW,
      },
    });

    res.status(201).json({ message: 'Ticket created', ticketId: ticket.id });
  } catch (error: any) {
    console.error('Error creating ticket from email webhook:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
