import { z } from "zod";

export type TicketStatus = 'NEW' | 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';

export const inboundEmailSchema = z.object({
  from: z.string().email("Invalid email address"),
  fromName: z.string().trim().min(1, "Sender name is required").optional(),
  subject: z.string().trim().min(1, "Subject is required"),
  body: z.string().min(1, "Body is required"),
  bodyHtml: z.string().optional(),
});

export type InboundEmailInput = z.infer<typeof inboundEmailSchema>;
