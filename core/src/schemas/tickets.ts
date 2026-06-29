import { z } from "zod";

export type TicketStatus = 'NEW' | 'OPEN' | 'PENDING' | 'RESOLVED' | 'CLOSED';

export const inboundEmailSchema = z.object({
  from: z.string().email("Invalid email address").max(255, "Email address is too long"),
  fromName: z.string().trim().min(1, "Sender name is required").max(100, "Sender name is too long").optional(),
  subject: z.string().trim().min(1, "Subject is required").max(255, "Subject is too long"),
  body: z.string().min(1, "Body is required").max(2000, "Body is too long"),
  bodyHtml: z.string().max(3000, "HTML Body is too long").optional(),
});

export type InboundEmailInput = z.infer<typeof inboundEmailSchema>;
