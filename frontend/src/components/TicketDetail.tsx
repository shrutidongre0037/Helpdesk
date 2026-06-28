import { Calendar, Mail, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TicketStatus } from "@helpdesk/core";

export const getStatusBadge = (status: TicketStatus) => {
  switch (status) {
    case "NEW":
      return (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200">
          New
        </Badge>
      );
    case "OPEN":
      return (
        <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80 border-yellow-200">
          Open
        </Badge>
      );
    case "PENDING":
      return (
        <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100/80 border-orange-200">
          Pending
        </Badge>
      );
    case "RESOLVED":
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200">
          Resolved
        </Badge>
      );
    case "CLOSED":
      return (
        <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-gray-200">
          Closed
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

interface TicketForDetail {
  id: number;
  subject: string;
  description: string;
  senderName: string | null;
  senderEmail: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
}

interface TicketDetailProps {
  ticket: TicketForDetail;
}

export function TicketDetail({ ticket }: TicketDetailProps) {
  return (
    <>
      {/* Header Section */}
      <div className="p-6 sm:p-8 border-b border-border bg-muted/10">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
                #TCK-{ticket.id}
              </span>
              {getStatusBadge(ticket.status)}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {ticket.subject}
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 sm:gap-8 text-sm text-muted-foreground mt-6">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            <div>
              <span className="block font-medium text-foreground">
                {ticket.senderName || "Unknown"}
              </span>
              <span>{ticket.senderEmail}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <div>
              <span className="block font-medium text-foreground">Created</span>
              <span>{new Date(ticket.createdAt).toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <div>
              <span className="block font-medium text-foreground">
                Last Updated
              </span>
              <span>{new Date(ticket.updatedAt).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-6 sm:p-8 flex-grow">
        <div className="prose prose-sm sm:prose-base dark:prose-invert max-w-none">
          {ticket.description ? (
            <div className="whitespace-pre-wrap">{ticket.description}</div>
          ) : (
            <p className="text-muted-foreground italic">
              No description provided.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
