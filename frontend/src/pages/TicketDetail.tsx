import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "../lib/auth";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { TicketStatus, TicketCategory } from "@helpdesk/core";
import { ErrorMessage } from "@/components/ErrorMessage";
import { ReplyThread } from "@/components/ReplyThread";
import { ReplyForm } from "@/components/ReplyForm";
import { TicketDetail as TicketDetailLeft } from "@/components/TicketDetail";
import { UpdateTicket } from "@/components/UpdateTicket";
import { BackButton } from "@/components/BackButton";

interface Reply {
  id: number;
  body: string;
  createdAt: string;
  sentType: "AGENT" | "CUSTOMER";
  author: { id: string; name: string; email: string } | null;
}

interface Ticket {
  id: number;
  subject: string;
  description: string;
  senderName: string | null;
  senderEmail: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  category: TicketCategory | null;
  assignedTo: { id: string; name: string } | null;
  replies: Reply[];
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: session, isPending: authPending } = useSession();

  const {
    data: ticket,
    isLoading,
    error,
  } = useQuery<Ticket>({
    queryKey: ["ticket", id],
    queryFn: async () => {
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
      const response = await axios.get(`${backendUrl}/api/tickets/${id}`, {
        withCredentials: true,
      });
      return response.data;
    },
    enabled: !!session && !!id,
  });

  // Removed submitReplyMutation from here as it's extracted to ReplyForm
  if (authPending || isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-32 mb-6" />
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 space-y-6">
          <Skeleton className="h-10 w-3/4" />
          <div className="flex gap-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <BackButton to="/tickets" label="Back to Tickets" />
        <ErrorMessage
          title="Error Loading Ticket"
          message={
            error instanceof Error
              ? error.message
              : "Could not find the requested ticket."
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-500">
      <BackButton
        to="/tickets"
        label="Back to Tickets"
        className="mb-6 -ml-4 hover:bg-muted/50"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column (Left, 2/3 width) */}
        <div className="lg:col-span-2 bg-card rounded-xl shadow-sm border border-border overflow-hidden flex flex-col">
          <TicketDetailLeft ticket={ticket} />

          {/* Replies Section */}
          <div className="border-t border-border bg-muted/5 flex flex-col h-full">
            <ReplyThread ticket={ticket} />
            <ReplyForm ticket={ticket} />
          </div>
        </div>

        {/* Sidebar Column (Right, 1/3 width) */}
        <UpdateTicket ticket={ticket} />
      </div>
    </div>
  );
}
