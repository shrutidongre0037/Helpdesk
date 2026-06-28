import { User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Reply {
  id: number;
  body: string;
  createdAt: string;
  sentType: "AGENT" | "CUSTOMER";
  author: { id: string; name: string; email: string } | null;
}

interface TicketForThread {
  senderName: string | null;
  senderEmail: string;
  replies: Reply[];
}

interface ReplyThreadProps {
  ticket: TicketForThread;
}

export function ReplyThread({ ticket }: ReplyThreadProps) {
  if (!ticket.replies || ticket.replies.length === 0) {
    return null;
  }

  return (
    <div className="p-6 sm:p-8 flex flex-col gap-6">
      <h3 className="text-lg font-semibold mb-2">Replies</h3>
      {ticket.replies.map((reply) => (
        <div
          key={reply.id}
          className={`flex flex-col gap-2 p-4 rounded-lg border shadow-sm ${
            reply.sentType === "CUSTOMER"
              ? "bg-background border-border mr-8"
              : "bg-primary/5 border-primary/20 ml-8"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <span className="font-medium text-sm flex items-center gap-2">
              {reply.sentType === "CUSTOMER" ? (
                <>
                  <UserIcon className="w-4 h-4 text-muted-foreground" />
                  {ticket.senderName || ticket.senderEmail}
                </>
              ) : (
                <>
                  <Badge variant="secondary" className="text-xs">
                    Agent
                  </Badge>
                  {reply.author?.name || "Unknown Agent"}
                </>
              )}
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {new Date(reply.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="whitespace-pre-wrap text-sm text-foreground/90 mt-1">
            {reply.body}
          </div>
        </div>
      ))}
    </div>
  );
}
