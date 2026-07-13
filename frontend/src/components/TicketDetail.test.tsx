import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TicketDetail } from "./TicketDetail";
import type { TicketStatus } from "@helpdesk/core";

describe("TicketDetail Component", () => {
  const mockTicket = {
    id: 123,
    subject: "Login Issue",
    description: "I cannot login to my account.",
    senderName: "John Doe",
    senderEmail: "john@example.com",
    status: "OPEN" as TicketStatus,
    createdAt: new Date("2023-01-01T10:00:00Z").toISOString(),
    updatedAt: new Date("2023-01-02T10:00:00Z").toISOString(),
    category: null,
    assignedTo: null,
  };

  it("renders ticket basic information", () => {
    render(<TicketDetail ticket={mockTicket} />);

    expect(screen.getByText("#TCK-123")).toBeInTheDocument();
    expect(screen.getByText("Login Issue")).toBeInTheDocument();
    expect(screen.getByText("I cannot login to my account.")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("Open")).toBeInTheDocument(); // Badge text
  });

  it("renders 'Unknown' if senderName is null", () => {
    render(<TicketDetail ticket={{ ...mockTicket, senderName: null }} />);
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });
  
  it("renders 'No description provided.' if description is empty", () => {
    render(<TicketDetail ticket={{ ...mockTicket, description: "" }} />);
    expect(screen.getByText("No description provided.")).toBeInTheDocument();
  });
});
