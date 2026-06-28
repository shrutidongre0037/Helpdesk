import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ReplyThread } from "./ReplyThread";

describe("ReplyThread Component", () => {
  const mockTicket = {
    senderName: "Customer Name",
    senderEmail: "customer@example.com",
    replies: [
      {
        id: 1,
        body: "I have a problem.",
        createdAt: new Date("2023-01-01T10:00:00Z").toISOString(),
        sentType: "CUSTOMER" as const,
        author: null,
      },
      {
        id: 2,
        body: "We are looking into it.",
        createdAt: new Date("2023-01-01T11:00:00Z").toISOString(),
        sentType: "AGENT" as const,
        author: { id: "a1", name: "Agent Smith", email: "smith@helpdesk.com" },
      },
    ],
  };

  it("renders null when there are no replies", () => {
    const { container } = render(<ReplyThread ticket={{ ...mockTicket, replies: [] }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders replies correctly", () => {
    render(<ReplyThread ticket={mockTicket} />);

    expect(screen.getByText("Replies")).toBeInTheDocument();

    // Customer reply
    expect(screen.getByText("I have a problem.")).toBeInTheDocument();
    expect(screen.getByText("Customer Name")).toBeInTheDocument();

    // Agent reply
    expect(screen.getByText("We are looking into it.")).toBeInTheDocument();
    expect(screen.getByText("Agent Smith")).toBeInTheDocument();
    expect(screen.getByText("Agent")).toBeInTheDocument(); // Agent badge
  });
});
