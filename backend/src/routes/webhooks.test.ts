import { describe, it, expect, mock, beforeEach } from "bun:test";
import express from "express";
import request from "supertest";
import webhooksRouter from "./webhooks";

// Mock prisma
const mockPrisma = {
  ticket: {
    findFirst: mock(),
    create: mock(),
    update: mock(),
  },
  ticketReply: {
    create: mock(),
  },
};

mock.module("../db", () => {
  return {
    default: mockPrisma,
  };
});

const app = express();
app.use(express.json());
app.use("/api/webhooks", webhooksRouter);

describe("Email Webhooks API", () => {
  const WEBHOOK_SECRET = "test-webhook-secret";

  beforeEach(() => {
    process.env.WEBHOOK_SECRET = WEBHOOK_SECRET;
    mockPrisma.ticket.findFirst.mockReset();
    mockPrisma.ticket.create.mockReset();
    mockPrisma.ticket.update.mockReset();
    mockPrisma.ticketReply.create.mockReset();
  });

  it("should create a ticket with valid payload", async () => {
    mockPrisma.ticket.findFirst.mockResolvedValue(null);
    mockPrisma.ticket.create.mockResolvedValue({ id: 1 });

    const payload = {
      from: "test-webhook@example.com",
      fromName: "Jane Doe",
      subject: "Unit Test Webhook",
      body: "This is a test body from unit test",
    };

    const res = await request(app)
      .post("/api/webhooks/email")
      .set("x-webhook-secret", WEBHOOK_SECRET)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe("Ticket created");
    expect(res.body.ticketId).toBe(1);
    expect(mockPrisma.ticket.create).toHaveBeenCalled();
  });

  it("should fail if missing required fields", async () => {
    const payload = {
      from: "test-webhook@example.com",
    };

    const res = await request(app)
      .post("/api/webhooks/email")
      .set("x-webhook-secret", WEBHOOK_SECRET)
      .send(payload);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid payload");
  });

  it("should fail if webhook secret is missing or invalid", async () => {
    const payload = {
      from: "test-webhook@example.com",
      fromName: "Jane Doe",
      subject: "Playwright Test Webhook",
      body: "This is a test body from Playwright e2e test",
    };

    const res = await request(app)
      .post("/api/webhooks/email")
      .set("x-webhook-secret", "wrong-secret")
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized: Invalid webhook secret");
  });
});
