import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Button } from "@/components/ui/button";

interface TicketForForm {
  id: number;
}

interface ReplyFormProps {
  ticket: TicketForForm;
}

export function ReplyForm({ ticket }: ReplyFormProps) {
  const queryClient = useQueryClient();
  const [replyBody, setReplyBody] = useState("");

  const submitReplyMutation = useMutation({
    mutationFn: async (body: string) => {
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
      const response = await axios.post(
        `${backendUrl}/api/tickets/${ticket.id}/replies`,
        { body, sentType: "AGENT" },
        { withCredentials: true },
      );
      return response.data;
    },
    onSuccess: () => {
      setReplyBody("");
      queryClient.invalidateQueries({
        queryKey: ["ticket", ticket.id.toString()],
      });
    },
  });

  return (
    <div className="p-6 sm:p-8 border-t border-border bg-background/50 mt-auto">
      <h3 className="text-lg font-semibold mb-4">Add Reply</h3>
      <div className="flex flex-col gap-4">
        <textarea
          className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-shadow"
          placeholder="Type your reply here..."
          value={replyBody}
          onChange={(e) => setReplyBody(e.target.value)}
          disabled={submitReplyMutation.isPending}
        />
        <div className="flex justify-end">
          <Button
            onClick={() => submitReplyMutation.mutate(replyBody)}
            disabled={submitReplyMutation.isPending || !replyBody.trim()}
            className="min-w-[120px]"
          >
            {submitReplyMutation.isPending ? "Sending..." : "Send Reply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
