import { Router } from 'express';
import prisma from '../db';
import { TicketStatus } from '../generated/prisma';
import { inboundEmailSchema } from '@helpdesk/core';


const router = Router();

router.post('/email', async (req, res) => {
  try {
    const providedSecret = req.headers['x-webhook-secret'];
    const expectedSecret = process.env.WEBHOOK_SECRET;

    if (!expectedSecret) {
      console.warn('WEBHOOK_SECRET is not configured in the environment');
    }

    if (expectedSecret && providedSecret !== expectedSecret) {
      res.status(401).json({ error: 'Unauthorized: Invalid webhook secret' });
      return;
    }

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
