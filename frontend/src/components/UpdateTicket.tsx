import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "../lib/auth";
import { Activity, User as UserIcon, Tag } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TicketStatus, TicketCategory } from "@helpdesk/core";

interface TicketForUpdate {
  id: number;
  status: TicketStatus;
  category: TicketCategory | null;
  assignedTo: { id: string; name: string } | null;
}

interface UpdateTicketProps {
  ticket: TicketForUpdate;
}

export function UpdateTicket({ ticket }: UpdateTicketProps) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const [selectedAgentId, setSelectedAgentId] = useState<string>("unassigned");
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>("NEW");
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | "unassigned">("unassigned");

  useEffect(() => {
    if (ticket) {
      setSelectedAgentId(ticket.assignedTo?.id || "unassigned");
      setSelectedStatus(ticket.status);
      setSelectedCategory(ticket.category || "unassigned");
    }
  }, [ticket?.assignedTo?.id, ticket?.status, ticket?.category]);

  const { data: usersData } = useQuery<any[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
      const response = await axios.get(`${backendUrl}/api/users`, {
        withCredentials: true,
      });
      return response.data;
    },
    enabled: !!session && session.user?.role === "ADMIN",
  });

  const updateTicketMutation = useMutation({
    mutationFn: async (data: {
      assignedToId?: string | null;
      status?: TicketStatus;
      category?: TicketCategory | null;
    }) => {
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
      const response = await axios.patch(
        `${backendUrl}/api/tickets/${ticket.id}`,
        data,
        { withCredentials: true },
      );
      return response.data;
    },
    onSuccess: (updatedTicket) => {
      queryClient.setQueryData(["ticket", ticket.id.toString()], updatedTicket);
      queryClient.invalidateQueries({
        queryKey: ["ticket", ticket.id.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
    onError: () => {
      setSelectedAgentId(ticket?.assignedTo?.id || "unassigned");
      setSelectedStatus(ticket?.status || "NEW");
      setSelectedCategory(ticket?.category || "unassigned");
    },
  });

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border p-6 h-fit">
      <h3 className="font-semibold text-lg mb-6 pb-4 border-b border-border">
        Ticket Details
      </h3>

      <div className="flex flex-col gap-6">
        {/* Status Dropdown */}
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <Activity className="w-4 h-4" />
            <span className="text-sm font-medium">Status</span>
          </div>
          {session?.user?.role === "ADMIN" ? (
            <Select
              value={selectedStatus}
              onValueChange={(val: TicketStatus) => {
                setSelectedStatus(val);
                updateTicketMutation.mutate({ status: val });
              }}
              disabled={updateTicketMutation.isPending}
            >
              <SelectTrigger className="w-full h-10 bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NEW">New</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="font-medium px-3 py-2 bg-muted/50 rounded-md border border-border">
              {ticket.status}
            </div>
          )}
        </div>

        {/* Category Dropdown */}
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <Tag className="w-4 h-4" />
            <span className="text-sm font-medium">Category</span>
          </div>
          {session?.user?.role === "ADMIN" ? (
            <Select
              value={selectedCategory}
              onValueChange={(val: TicketCategory | "unassigned") => {
                setSelectedCategory(val);
                updateTicketMutation.mutate({ category: val === "unassigned" ? null : val });
              }}
              disabled={updateTicketMutation.isPending}
            >
              <SelectTrigger className="w-full h-10 bg-background">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                <SelectItem value="TECHNICAL">Technical</SelectItem>
                <SelectItem value="GENERAL">General</SelectItem>
                <SelectItem value="REFUND">Refund</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="font-medium px-3 py-2 bg-muted/50 rounded-md border border-border">
              {ticket.category ? ticket.category : "Unassigned"}
            </div>
          )}
        </div>

        {/* Assigned To Dropdown */}
        <div>
          <div className="flex items-center gap-2 text-muted-foreground mb-3">
            <UserIcon className="w-4 h-4" />
            <span className="text-sm font-medium">Assigned To</span>
          </div>
          {session?.user?.role === "ADMIN" ? (
            <Select
              value={selectedAgentId}
              onValueChange={(val) => {
                setSelectedAgentId(val);
                updateTicketMutation.mutate({
                  assignedToId: val === "unassigned" ? null : val,
                });
              }}
              disabled={updateTicketMutation.isPending}
            >
              <SelectTrigger className="w-full h-10 bg-background">
                <SelectValue placeholder="Select Agent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {usersData?.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="font-medium px-3 py-2 bg-muted/50 rounded-md border border-border">
              {ticket.assignedTo ? ticket.assignedTo.name : "Unassigned"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
