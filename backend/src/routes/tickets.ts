import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import prisma from "../db";
import { generateText } from "ai";
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createReplySchema, polishReplySchema } from "@helpdesk/core";
import { z } from "zod";


const router = Router();

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || "",
});

// GET /api/tickets - fetch all tickets sorted by newest first (or custom sort)
router.get("/", requireAuth, async (req, res) => {
  try {
    const {
      sort = "createdAt",
      order = "desc",
      status,
      search,
      page = "1",
      limit = "10",
    } = req.query;

    const validSortFields = [
      "createdAt",
      "subject",
      "status",
      "senderName",
      "senderEmail",
    ];
    const sortBy = validSortFields.includes(sort as string)
      ? (sort as string)
      : "createdAt";
    const sortOrder = order === "asc" ? "asc" : "desc";

    const parsedPage = parseInt(page as string, 10) || 1;
    const parsedLimit = parseInt(limit as string, 10) || 10;
    const skip = (parsedPage - 1) * parsedLimit;

    const whereClause: any = {};
    if (status && typeof status === "string" && status !== "ALL") {
      whereClause.status = status;
    }

    if (search && typeof search === "string" && search.trim() !== "") {
      whereClause.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { senderName: { contains: search, mode: "insensitive" } },
        { senderEmail: { contains: search, mode: "insensitive" } },
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
            },
          },
        },
      }),
    ]);

    res.json({
      data: tickets,
      meta: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching tickets:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/tickets/:id - fetch a single ticket by ID
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Missing ticket ID" });
    }
    const ticketId = parseInt(id as string, 10);

    if (isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
        replies: {
          orderBy: {
            createdAt: "asc",
          },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    res.json(ticket);
  } catch (error: any) {
    console.error("Error fetching ticket:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// PATCH /api/tickets/:id - update a ticket (e.g. assign to an agent)
router.patch("/:id", requireAuth, async (req, res) => {
  try {
    // Only admins can assign tickets
    if (req.user?.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Forbidden: Only admins can update tickets" });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Missing ticket ID" });
    }
    const ticketId = parseInt(id as string, 10);

    if (isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    const { assignedToId, status } = req.body;
    const dataToUpdate: any = {};

    if (assignedToId !== undefined) {
      if (assignedToId !== null) {
        const user = await prisma.user.findUnique({
          where: { id: assignedToId },
        });

        if (!user || user.deletedAt !== null) {
          return res
            .status(400)
            .json({
              error: "Invalid or inactive user specified for assignment",
            });
        }
      }
      dataToUpdate.assignedToId = assignedToId;
    }

    if (status !== undefined) {
      const validStatuses = ["NEW", "OPEN", "PENDING", "RESOLVED", "CLOSED"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid ticket status" });
      }
      dataToUpdate.status = status;
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ error: "No fields to update" });
    }

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: dataToUpdate,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(ticket);
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "Ticket not found" });
    }
    console.error("Error updating ticket:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/tickets/:id/replies - add a reply to a ticket
router.post("/:id/replies", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: "Missing ticket ID" });
    }
    const ticketId = parseInt(id as string, 10);

    if (isNaN(ticketId)) {
      return res.status(400).json({ error: "Invalid ticket ID" });
    }

    const validationResult = createReplySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.errors[0]?.message || "Invalid input" });
    }
    
    const { body } = validationResult.data;
    const { sentType } = req.body;

    // Verify ticket exists
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const reply = await prisma.ticketReply.create({
      data: {
        body,
        ticketId,
        authorId: req.user?.id,
        sentType: sentType || "AGENT",
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(reply);
  } catch (error: any) {
    console.error("Error creating ticket reply:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/tickets/:id/polish - polish a reply using AI
router.post("/:id/polish", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const ticketId = parseInt(id as string, 10);
    
    // Fetch the ticket to get the customer's name
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    const validationResult = polishReplySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({ error: validationResult.error.errors[0]?.message || "Invalid input" });
    }

    const { body } = validationResult.data;

    const agentName = req.user?.name || "Support Agent";
    const customerName = ticket.senderName || "Customer";

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt: `You are a support agent assistant for customer support team. Please improve and polish the following support agent reply to be more professional, empathetic, and clear. Do not add any new information, preserve the original meaning and keep the response concise and to the point. Just improve the phrasing if needed. Start the reply by greeting the customer by their name: "${customerName}". Finally, sign the polished reply using the agent's name "${agentName}" and include the link "https://enjayworld.com":\n\n${body}`,
    });

    res.json({ polishedText: text });
  } catch (error: any) {
    console.error("Error polishing reply:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/tickets/:id/summarize - summarize ticket and conversation history
router.post("/:id/summarize", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const ticketId = parseInt(id as string, 10);
    
    // Fetch the ticket and all replies
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        replies: {
          orderBy: { createdAt: "asc" },
          include: {
            author: {
              select: { name: true }
            }
          }
        }
      }
    });

    if (!ticket) {
      return res.status(404).json({ error: "Ticket not found" });
    }

    // Construct the prompt
    let prompt = `Please summarize the following support ticket and its conversation history. Keep the summary concise but informative.\n\n`;
    prompt += `Ticket Subject: ${ticket.subject}\n`;
    prompt += `Ticket Description: ${ticket.description}\n\n`;
    prompt += `Conversation History:\n`;

    if (ticket.replies.length === 0) {
      prompt += "(No replies yet)\n";
    } else {
      for (const reply of ticket.replies) {
        const authorName = reply.author?.name || (reply.sentType === "CUSTOMER" ? ticket.senderName || "Customer" : "Agent");
        prompt += `${authorName}: ${reply.body}\n\n`;
      }
    }

    const { text } = await generateText({
      model: google('gemini-2.5-flash'),
      prompt,
    });

    res.json({ summary: text });
  } catch (error: any) {
    console.error("Error summarizing ticket:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
