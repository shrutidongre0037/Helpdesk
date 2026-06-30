import { useState, useEffect } from 'react';
import { useSession } from '../lib/auth';
import { Navigate, Link } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Ticket as TicketIcon, Calendar, Mail, User as UserIcon, Tag, ArrowUp, ArrowDown, ArrowUpDown, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { TicketStatus, TicketCategory } from '@helpdesk/core';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { SortingState, PaginationState } from '@tanstack/react-table';

interface Ticket {
  id: number;
  subject: string;
  senderName: string | null;
  senderEmail: string;
  status: TicketStatus;
  createdAt: string;
  category: string | null;
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

const columnHelper = createColumnHelper<Ticket>();

const columns = [
  columnHelper.accessor('subject', {
    header: 'Subject',
    cell: (info) => (
      <div className="flex flex-col">
        <Link to={`/tickets/${info.row.original.id}`} className="font-medium text-base hover:text-indigo-600">
          {info.getValue()}
        </Link>
        <span className="text-xs text-muted-foreground mt-1">#TCK-{info.row.original.id}</span>
      </div>
    ),
  }),
  columnHelper.accessor('senderEmail', {
    id: 'senderEmail', // Used for sorting
    header: 'Requester',
    cell: (info) => (
      <div className="flex flex-col gap-1">
        {info.row.original.senderName && (
          <span className="font-medium text-foreground text-sm">{info.row.original.senderName}</span>
        )}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mail className="w-3 h-3" />
          <span>{info.getValue()}</span>
        </div>
      </div>
    ),
  }),
  columnHelper.accessor('status', {
    header: 'Status',
    cell: (info) => getStatusBadge(info.getValue()),
  }),
  columnHelper.accessor('category', {
    header: 'Category',
    cell: (info) => {
      const cat = info.getValue();
      return cat ? (
        <Badge variant="outline" className="bg-muted text-muted-foreground font-normal">
          {cat}
        </Badge>
      ) : (
        <span className="text-muted-foreground italic text-xs">Unclassified</span>
      );
    },
  }),
  columnHelper.accessor('assignedTo', {
    id: 'assignedTo', // not sortable currently on backend without join logic
    header: 'Assigned To',
    enableSorting: false,
    cell: (info) => {
      const assignedTo = info.getValue();
      return assignedTo ? (
        <div className="flex items-center gap-2">
          <UserIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">{assignedTo.name}</span>
        </div>
      ) : (
        <span className="text-muted-foreground italic text-sm">Unassigned</span>
      );
    },
  }),
  columnHelper.accessor('createdAt', {
    header: 'Created',
    cell: (info) => (
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        <Calendar className="w-4 h-4" />
        <span>{new Date(info.getValue()).toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        })}</span>
      </div>
    ),
  }),
];

export default function Tickets() {
  const { data: session, isPending: authPending } = useSession();
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: responseData, isLoading: loading, error: queryError } = useQuery({
    queryKey: ['tickets', sorting, statusFilter, categoryFilter, searchQuery, pagination],
    queryFn: async () => {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const sort = sorting.length > 0 ? sorting[0].id : 'createdAt';
      const order = sorting.length > 0 && sorting[0].desc ? 'desc' : 'asc';
      
      const response = await axios.get(`${backendUrl}/api/tickets`, {
        withCredentials: true,
        params: { 
          sort, 
          order, 
          status: statusFilter, 
          category: categoryFilter,
          search: searchQuery,
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize
        },
      });
      return response.data as { data: Ticket[]; meta: any };
    },
    enabled: !!session,
  });

  const tickets = responseData?.data || [];

  const table = useReactTable({
    data: tickets,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
    manualPagination: true,
    pageCount: responseData?.meta?.totalPages ?? -1,
  });

  const error = queryError ? (queryError as any).response?.data?.error || queryError.message || 'An error occurred' : null;

  if (!authPending && !session) {
    return <Navigate to="/login" replace />;
  }

  const showLoader = authPending || loading;

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
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search tickets..."
              className="w-[250px] pl-9"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              <SelectItem value="TECHNICAL">Technical</SelectItem>
              <SelectItem value="GENERAL">General</SelectItem>
              <SelectItem value="REFUND">Refund</SelectItem>
              <SelectItem value="UNCLASSIFIED">Unclassified</SelectItem>
            </SelectContent>
          </Select>
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
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => {
                        return (
                          <th key={header.id} scope="col" className="px-6 py-4 font-semibold">
                            {header.isPlaceholder ? null : (
                              <div
                                {...{
                                  className: header.column.getCanSort()
                                    ? 'group cursor-pointer select-none flex items-center gap-1 hover:text-foreground transition-colors'
                                    : 'flex items-center gap-1',
                                  onClick: header.column.getToggleSortingHandler(),
                                }}
                              >
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                                {{
                                  asc: <ArrowUp className="w-3 h-3" />,
                                  desc: <ArrowDown className="w-3 h-3" />,
                                }[header.column.getIsSorted() as string] ?? (
                                  header.column.getCanSort() ? (
                                    <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  ) : null
                                )}
                              </div>
                            )}
                          </th>
                        )
                      })}
                    </tr>
                  ))}
                </thead>
                <tbody className="divide-y divide-border">
                  {table.getRowModel().rows.map((row) => (
                    <tr 
                      key={row.id} 
                      className="bg-card hover:bg-muted/30 transition-colors duration-200 cursor-pointer"
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id} className="px-6 py-4">
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                  
                  {tickets.length === 0 && (
                    <tr>
                      <td colSpan={columns.length} className="px-6 py-12 text-center text-muted-foreground">
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
            {tickets.length > 0 && (
              <div className="border-t border-border p-4 flex items-center justify-between bg-muted/10">
                <div className="text-sm text-muted-foreground font-medium">
                  Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() === -1 ? '...' : table.getPageCount()}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.firstPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="shadow-sm"
                  >
                    First
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className="shadow-sm"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className="shadow-sm"
                  >
                    Next
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.lastPage()}
                    disabled={!table.getCanNextPage()}
                    className="shadow-sm"
                  >
                    Last
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
