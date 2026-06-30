import { Router } from "express";
import prisma from "../db";
import { TicketStatus } from "../generated/prisma";
import { inboundEmailSchema } from "@helpdesk/core";
import { boss } from "../queues/ticketQueue";

const router = Router();

router.post("/email", async (req, res) => {
  try {
    const providedSecret = req.headers["x-webhook-secret"];
    const expectedSecret = process.env.WEBHOOK_SECRET;

    if (!expectedSecret) {
      console.warn("WEBHOOK_SECRET is not configured in the environment");
    }

    if (expectedSecret && providedSecret !== expectedSecret) {
      res.status(401).json({ error: "Unauthorized: Invalid webhook secret" });
      return;
    }

    const parseResult = inboundEmailSchema.safeParse(req.body);

    if (!parseResult.success) {
      res
        .status(400)
        .json({
          error: "Invalid payload",
          details: parseResult.error.format(),
        });
      return;
    }

    const { from, fromName, subject, body } = parseResult.data;

    // Clean up subject prefix (e.g., "Re: ", "Fwd: ")
    const normalizedSubject = subject.replace(/^(re|fwd|fw):\s*/i, "").trim();

    const existingTicket = await prisma.ticket.findFirst({
      where: {
        subject: { equals: normalizedSubject, mode: "insensitive" },
        senderEmail: from,
        status: { not: TicketStatus.CLOSED },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (existingTicket) {
      await prisma.ticketReply.create({
        data: {
          body,
          sentType: "CUSTOMER",
          ticketId: existingTicket.id,
        },
      });

      // Automatically reopen ticket if it was resolved/pending
      if (
        existingTicket.status !== TicketStatus.OPEN &&
        existingTicket.status !== TicketStatus.NEW
      ) {
        await prisma.ticket.update({
          where: { id: existingTicket.id },
          data: { status: TicketStatus.OPEN },
        });
      }

      res.status(200).json({ message: "Reply added", ticket: existingTicket });
      return;
    }

    const ticket = await prisma.ticket.create({
      data: {
        senderEmail: from,
        senderName: fromName || null,
        subject: subject,
        description: body,
        status: TicketStatus.NEW,
      },
    });

    await boss.send("classify-ticket", { ticketId: ticket.id });

    res.status(201).json({ message: "Ticket created", ticketId: ticket.id });
  } catch (error: any) {
    console.error("Error creating ticket from email webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
