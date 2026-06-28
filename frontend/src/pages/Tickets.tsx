import { useSession } from '../lib/auth';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Ticket as TicketIcon, Calendar, Mail, User as UserIcon, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { TicketStatus } from '@helpdesk/core';

interface Ticket {
  id: number;
  subject: string;
  senderName: string | null;
  senderEmail: string;
  status: TicketStatus;
  createdAt: string;
  assignedTo: { id: string; name: string } | null;
}

export default function Tickets() {
  const { data: session, isPending: authPending } = useSession();

  const { data: tickets = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['tickets'],
    queryFn: async () => {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await axios.get(`${backendUrl}/api/tickets`, {
        withCredentials: true,
      });
      return response.data as Ticket[];
    },
    enabled: !!session,
  });

  const error = queryError ? (queryError as any).response?.data?.error || queryError.message || 'An error occurred' : null;

  if (!authPending && !session) {
    return <Navigate to="/login" replace />;
  }

  const showLoader = authPending || loading;

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <TicketIcon className="w-8 h-8 text-indigo-600" />
            Tickets
          </h1>
          <p className="text-muted-foreground mt-2">
            View and manage support tickets.
          </p>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        {showLoader ? (
          <div className="p-0">
            <div className="border-b border-border bg-muted/50 p-4 flex gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
            </div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex items-center gap-6 border-b border-border last:border-0">
                <div className="flex items-center gap-3 w-1/4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="w-1/4">
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="w-1/6">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="w-1/6">
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p>Error: {error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th scope="col" className="px-6 py-4 font-semibold">Subject</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Requester</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Status</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Assigned To</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {tickets.map((ticket) => (
                  <tr 
                    key={ticket.id} 
                    className="bg-card hover:bg-muted/30 transition-colors duration-200 cursor-pointer"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground text-base">{ticket.subject}</span>
                        <span className="text-xs text-muted-foreground mt-1">#TCK-{ticket.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        {ticket.senderName && (
                          <span className="font-medium text-foreground text-sm">{ticket.senderName}</span>
                        )}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span>{ticket.senderEmail}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="px-6 py-4">
                      {ticket.assignedTo ? (
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{ticket.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground italic text-sm">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-sm">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(ticket.createdAt).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {tickets.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center">
                        <Tag className="w-12 h-12 mb-4 text-muted-foreground/50" />
                        <p className="text-lg font-medium">No tickets found</p>
                        <p className="text-sm">There are currently no tickets in the system.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
