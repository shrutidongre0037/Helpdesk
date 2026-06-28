import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useSession } from '../lib/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Ticket as TicketIcon, Calendar, Mail, User as UserIcon, Clock, Activity } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TicketStatus } from '@helpdesk/core';

interface Ticket {
  id: number;
  subject: string;
  description: string;
  senderName: string | null;
  senderEmail: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  assignedTo: { id: string; name: string } | null;
}

const getStatusBadge = (status: TicketStatus) => {
  switch (status) {
    case 'NEW':
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100/80 border-blue-200">New</Badge>;
    case 'OPEN':
      return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80 border-yellow-200">Open</Badge>;
    case 'PENDING':
      return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100/80 border-orange-200">Pending</Badge>;
    case 'RESOLVED':
      return <Badge className="bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200">Resolved</Badge>;
    case 'CLOSED':
      return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100/80 border-gray-200">Closed</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export default function TicketDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: session, isPending: authPending } = useSession();
  const queryClient = useQueryClient();

  const { data: ticket, isLoading, error } = useQuery<Ticket>({
    queryKey: ['ticket', id],
    queryFn: async () => {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await axios.get(`${backendUrl}/api/tickets/${id}`, {
        withCredentials: true,
      });
      return response.data;
    },
    enabled: !!session && !!id,
  });

  const [selectedAgentId, setSelectedAgentId] = useState<string>("unassigned");
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus>("NEW");

  useEffect(() => {
    if (ticket) {
      setSelectedAgentId(ticket.assignedTo?.id || "unassigned");
      setSelectedStatus(ticket.status);
    }
  }, [ticket?.assignedTo?.id, ticket?.status]);

  const { data: usersData } = useQuery<any[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await axios.get(`${backendUrl}/api/users`, {
        withCredentials: true,
      });
      return response.data;
    },
    enabled: !!session && session.user?.role === 'ADMIN',
  });

  const updateTicketMutation = useMutation({
    mutationFn: async (data: { assignedToId?: string | null; status?: TicketStatus }) => {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await axios.patch(
        `${backendUrl}/api/tickets/${id}`,
        data,
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: (updatedTicket) => {
      // Update cache immediately to avoid extra network request delay
      queryClient.setQueryData(['ticket', id], updatedTicket);
      // Invalidate to be safe and ensure lists are updated
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
    },
    onError: () => {
      // Revert local state on error
      setSelectedAgentId(ticket?.assignedTo?.id || "unassigned");
      setSelectedStatus(ticket?.status || "NEW");
    },
  });

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
        <Button variant="ghost" onClick={() => navigate('/tickets')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Tickets
        </Button>
        <div className="bg-destructive/10 text-destructive p-6 rounded-xl border border-destructive/20 text-center">
          <h2 className="text-xl font-semibold mb-2">Error Loading Ticket</h2>
          <p>{error instanceof Error ? error.message : 'Could not find the requested ticket.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-500">
      <Button variant="ghost" onClick={() => navigate('/tickets')} className="mb-6 -ml-4 hover:bg-muted/50">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Tickets
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Column (Left, 2/3 width) */}
        <div className="lg:col-span-2 bg-card rounded-xl shadow-sm border border-border overflow-hidden flex flex-col">
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
                  <span className="block font-medium text-foreground">{ticket.senderName || 'Unknown'}</span>
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
                  <span className="block font-medium text-foreground">Last Updated</span>
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
                <p className="text-muted-foreground italic">No description provided.</p>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Column (Right, 1/3 width) */}
        <div className="bg-card rounded-xl shadow-sm border border-border p-6 h-fit">
          <h3 className="font-semibold text-lg mb-6 pb-4 border-b border-border">Ticket Details</h3>
          
          <div className="flex flex-col gap-6">
            {/* Status Dropdown */}
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <Activity className="w-4 h-4" />
                <span className="text-sm font-medium">Status</span>
              </div>
              {session?.user?.role === 'ADMIN' ? (
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

            {/* Assigned To Dropdown */}
            <div>
              <div className="flex items-center gap-2 text-muted-foreground mb-3">
                <UserIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Assigned To</span>
              </div>
              {session?.user?.role === 'ADMIN' ? (
                <Select 
                  value={selectedAgentId} 
                  onValueChange={(val) => {
                    setSelectedAgentId(val);
                    updateTicketMutation.mutate({ assignedToId: val === "unassigned" ? null : val });
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
                  {ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
