# Tech Stack: AI-Powered Ticket Management System

This document outlines the selected technology stack for the project, based on the requirements for Version 1 (MVP) and Version 2, incorporating AI features and a modern UI.

## 1. Frontend (User Interface)
*Goal: Build a highly responsive, modern, and dynamic agent dashboard.*

*   **Framework:** **React (via Vite) + TypeScript**. 
    *   *Why:* A fast, modern build tool combined with React and TypeScript for strong typing and component-based architecture.
*   **Routing:** **React Router**.
    *   *Why:* The industry standard for handling navigation in a React single-page application (SPA).
*   **Styling:** **Tailwind CSS**.
    *   *Why:* A utility-first CSS framework that allows for rapid UI development and easy implementation of modern designs.

## 2. Backend (Core Logic & API)
*Goal: Handle email processing, ticket routing, and seamless AI interactions.*

*   **Language & Framework:** **Node.js with Express + TypeScript**.
    *   *Why:* Allows for a unified TypeScript codebase across the entire project (Frontend & Backend). Express provides a lightweight, flexible API foundation.
*   **Authentication:** **Database-backed Sessions (Cookie-based)**.
    *   *Why:* Secure, traditional approach storing session IDs in HTTP-only cookies and tracking active sessions in PostgreSQL.
*   **ORM (Object-Relational Mapping):** **Prisma**.
    *   *Why:* Excellent developer experience with fully typed database access, making it seamless to work with PostgreSQL and TypeScript.
*   **AI Integration:** **Google Gemini API** (via official SDKs).
    *   *Why:* Specified in the requirements for classification, summaries, and reply generation.
*   **Email Ingestion:** **SendGrid Inbound Parse** or **Mailgun**.
    *   *Why:* Receives emails and forwards them as parsed JSON webhooks to your backend.

## 3. Database & Storage
*Goal: Store ticket data, handle complex relationships, and manage user sessions.*

*   **Primary Database:** **PostgreSQL**.
    *   *Why:* The industry standard for relational data. Perfect for complex relationships between Tickets, Users, Departments, and Audit Logs.
*   **Vector Search (for Knowledge Base):** **pgvector** (PostgreSQL extension).
    *   *Why:* To generate highly accurate AI auto-responses, `pgvector` allows you to store AI embeddings and perform semantic searches right alongside your relational ticket data in Postgres.

## 5. Deployment & Infrastructure
*Goal: Scalable, reliable, and easy to maintain hosting.*

*   **Containerization:** **Docker**.
    *   *Why:* Ensures the application runs consistently across development, staging, and production environments.
*   **Cloud Provider (Suggested):** **Render** or **Google Cloud Run** / **AWS App Runner**.
    *   *See recommendations below.*

---

### V1 Starter Stack Summary
*   **Frontend:** React (Vite) + TypeScript + Tailwind CSS + React Router
*   **Backend:** Node.js (Express) + TypeScript + Prisma ORM
*   **Database:** PostgreSQL (with `pgvector` for AI embeddings)
*   **Authentication:** Session-based Auth
*   **Background Jobs:** Redis + BullMQ
*   **Deployment:** Dockerized on a modern Cloud Provider
