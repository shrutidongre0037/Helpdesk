# AI Helpdesk - Knowledge Base

This document contains frequently asked questions and context about the AI Helpdesk project. It is designed to serve as a reference for AI agents to generate accurate, project-specific responses.

## 1. Architecture and Tech Stack

**Q: What is the core technology stack of this project?**
A: The project is divided into a frontend and backend:
- **Frontend:** React, Vite, Shadcn UI, Tailwind CSS, TanStack Table.
- **Backend:** Node.js, Express.js.
- **Database:** PostgreSQL accessed via Prisma ORM.
- **Authentication:** Better Auth.
- **Background Jobs:** pg-boss (migrated from BullMQ).
- **AI Integration:** Google Gemini API (via Vercel AI SDK).

**Q: How is authentication handled?**
A: Authentication is managed using Better Auth, which handles user sessions, credentials, and role-based access control. Administrator credentials and roles are seeded via the database seed scripts.

**Q: How are background tasks processed?**
A: Background tasks, such as webhook processing and ticket classification, are handled by `pg-boss`. This allows job queues to be managed directly within the PostgreSQL database, eliminating the need for a separate Redis instance (which was required when using BullMQ).

## 2. Ticket Management Features

**Q: How are incoming tickets classified?**
A: The system features an automated, AI-powered ticket classification system. Incoming tickets (often via webhooks) are analyzed by the Gemini API to determine their category. Agents also have the ability to manually override the AI's classification via a UI dropdown.

**Q: How does the AI ticket summarization feature work?**
A: In the ticket interface, there is a "Summarize" button (represented by a sparkle icon). Clicking this triggers the Gemini AI to analyze the ticket's original content along with the entire conversation history, generating a concise summary for the agent.

**Q: What is the "AI Polish" feature for replies?**
A: When agents are drafting replies to users, they can use the Gemini AI integration to rewrite, professionalize, or "polish" their drafted text before sending it.

**Q: Are ticket lists paginated and sortable?**
A: Yes, the frontend utilizes TanStack Table to display tickets, with server-side pagination, sorting, and debounced global search implemented in the backend API to handle large datasets efficiently.

## 3. User and Agent Management

**Q: What are the requirements for creating a new user?**
A: When creating or updating a user via the Admin User Management module, a 'role' must be explicitly assigned. This is strictly enforced by both frontend Zod validation schemas and backend API constraints.

**Q: What happens to a user's tickets if their account is deleted?**
A: To maintain data integrity, when a user is deleted from the system, a mechanism automatically unassigns all tickets currently assigned to them (by setting the `assignedToId` field to `null`).

## 4. Other System Modules

**Q: What is the Tour Planning / User Availability feature?**
A: The system includes a User Availability modal with city-based filtering. It involves specific AJAX handling to ensure that filters (like `cityName`) persist accurately during automatic background refreshes (e.g., every 20 seconds).

## 5. Edge Cases & Error Handling

**Q: How does the system handle AI failures during ticket classification or summarization?**
A: If the Gemini API experiences downtime, rate limits, or timeouts, the system gracefully falls back. For classification, tickets default to an "Uncategorized" status for manual review. For summarization or polishing, the UI displays a user-friendly error message allowing the agent to retry or proceed manually.

**Q: What happens if a ticket contains no text or is completely empty when sent for AI classification?**
A: The backend validates the input before sending it to the AI. Empty tickets bypass the AI classification step and are automatically assigned a default or "Needs Triage" category to prevent unnecessary API calls and potential errors.

**Q: How are extremely long conversation histories managed during AI summarization?**
A: To prevent exceeding token limits of the Gemini model, conversation histories that are too long should be truncated. This usually involves passing the original ticket description and only the most recent messages to provide the best context without failing the request.

**Q: Are AI-generated summaries guaranteed to be accurate?**
A: No. Because AI models can hallucinate details, the UI emphasizes that summaries and polished replies are AI-generated. Agents are ultimately responsible for verifying critical information against the original ticket context.

**Q: What occurs if a pg-boss background worker crashes mid-job (e.g., during webhook processing)?**
A: pg-boss operates entirely within PostgreSQL. If a worker crashes, the job state remains in the database. Utilizing pg-boss's built-in retry mechanisms, the job will eventually be picked up by another active worker or moved to a dead-letter queue after a maximum number of retries.

**Q: How do UI filters behave during automatic background refreshes?**
A: When a component (like the User Availability modal) refreshes its data periodically (e.g., every 20 seconds via polling), the frontend must explicitly re-send the current filter state (e.g., the selected `cityName`) in the AJAX request. Failure to do so would result in the filters being "lost" and the UI resetting to an unfiltered state.

**Q: What happens if an agent is editing a ticket while another agent or background process updates it?**
A: The system relies on database mechanisms or real-time UI updates to handle concurrency. If an agent tries to save changes to a ticket that has been modified since they opened it, they should ideally be prompted to review the latest changes before overwriting, preventing lost updates.
