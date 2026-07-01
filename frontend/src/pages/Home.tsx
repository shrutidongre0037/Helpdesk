import { useSession } from '../lib/auth';
import { Navigate, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Ticket, FolderOpen, Bot, Percent, Clock, ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function Home() {
  const { data: session, isPending } = useSession();

  const { data: metrics, isLoading: isMetricsLoading } = useQuery({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await axios.get(`${backendUrl}/api/tickets/metrics`, {
        withCredentials: true,
      });
      return response.data;
    },
    enabled: !!session,
  });

  if (isPending) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <Skeleton className="h-12 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-80 rounded-3xl" />
          <Skeleton className="h-80 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col justify-between items-start gap-4 bg-gradient-to-r from-primary/10 to-indigo-600/10 p-8 rounded-3xl border border-primary/20 shadow-sm backdrop-blur-xl">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600">
            Welcome to Helpdesk AI
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Hello, <span className="font-semibold text-foreground">{session.user.name}</span>! Here's an overview of your workspace.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Performance Metrics</h2>
        </div>
        
        {isMetricsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-primary/10 bg-gradient-to-b from-white to-white/50 dark:from-zinc-950 dark:to-zinc-950/50 backdrop-blur-xl overflow-hidden relative rounded-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Ticket className="w-16 h-16 text-primary" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Tickets</CardTitle>
                <div className="p-2 bg-primary/10 rounded-full">
                  <Ticket className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="z-10 relative">
                <div className="text-3xl font-black text-foreground">{metrics?.totalTickets || 0}</div>
              </CardContent>
            </Card>
            
            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-orange-500/10 bg-gradient-to-b from-white to-white/50 dark:from-zinc-950 dark:to-zinc-950/50 backdrop-blur-xl overflow-hidden relative rounded-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <FolderOpen className="w-16 h-16 text-orange-500" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
                <CardTitle className="text-sm font-medium text-muted-foreground">Open Tickets</CardTitle>
                <div className="p-2 bg-orange-500/10 rounded-full">
                  <FolderOpen className="h-4 w-4 text-orange-500" />
                </div>
              </CardHeader>
              <CardContent className="z-10 relative">
                <div className="text-3xl font-black text-foreground">{metrics?.openTickets || 0}</div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-green-500/10 bg-gradient-to-b from-white to-white/50 dark:from-zinc-950 dark:to-zinc-950/50 backdrop-blur-xl overflow-hidden relative rounded-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Bot className="w-16 h-16 text-green-500" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
                <CardTitle className="text-sm font-medium text-muted-foreground">AI Resolved</CardTitle>
                <div className="p-2 bg-green-500/10 rounded-full">
                  <Bot className="h-4 w-4 text-green-500" />
                </div>
              </CardHeader>
              <CardContent className="z-10 relative">
                <div className="text-3xl font-black text-foreground">{metrics?.aiResolved || 0}</div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-purple-500/10 bg-gradient-to-b from-white to-white/50 dark:from-zinc-950 dark:to-zinc-950/50 backdrop-blur-xl overflow-hidden relative rounded-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Percent className="w-16 h-16 text-purple-500" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
                <CardTitle className="text-sm font-medium text-muted-foreground">AI Resolution Rate</CardTitle>
                <div className="p-2 bg-purple-500/10 rounded-full">
                  <Percent className="h-4 w-4 text-purple-500" />
                </div>
              </CardHeader>
              <CardContent className="z-10 relative">
                <div className="text-3xl font-black text-foreground">{metrics?.percentAiResolved ?? 0}%</div>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-blue-500/10 bg-gradient-to-b from-white to-white/50 dark:from-zinc-950 dark:to-zinc-950/50 backdrop-blur-xl overflow-hidden relative rounded-2xl">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Clock className="w-16 h-16 text-blue-500" />
              </div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 z-10 relative">
                <CardTitle className="text-sm font-medium text-muted-foreground">Avg Resolution</CardTitle>
                <div className="p-2 bg-blue-500/10 rounded-full">
                  <Clock className="h-4 w-4 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent className="z-10 relative">
                <div className="text-3xl font-black text-foreground">{metrics?.avgResolutionHours || "0.0h"}</div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-border/40 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md shadow-lg rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-muted/20">
            <CardTitle>Ticket Volume (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[300px]">
            {isMetricsLoading ? (
              <Skeleton className="w-full h-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics?.dailyTickets || []}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-10" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    stroke="currentColor"
                    className="opacity-50 text-xs"
                    tickLine={false}
                    axisLine={false}
                    minTickGap={20}
                  />
                  <YAxis 
                    stroke="currentColor" 
                    className="opacity-50 text-xs" 
                    tickLine={false} 
                    axisLine={false} 
                    allowDecimals={false}
                  />
                  <Tooltip 
                    cursor={{ fill: 'currentColor', opacity: 0.1 }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', background: 'var(--background)' }}
                    labelFormatter={(val) => new Date(val).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  />
                  <Bar dataKey="count" fill="currentColor" className="fill-primary" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-white/40 dark:bg-zinc-950/40 backdrop-blur-md shadow-lg rounded-3xl overflow-hidden">
          <CardHeader className="border-b border-border/40 bg-muted/20">
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest ticket updates
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/40">
              <div className="flex items-center p-6 bg-background/20 hover:bg-muted/40 transition-colors cursor-pointer group">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mr-5 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold leading-none group-hover:text-primary transition-colors">Cannot access email</p>
                  <p className="text-sm text-muted-foreground">Opened by Sarah J. • 2 hours ago</p>
                </div>
                <div className="text-sm font-medium text-blue-500 bg-blue-500/10 px-3 py-1 rounded-full">Open</div>
              </div>
              <div className="flex items-center p-6 bg-background/20 hover:bg-muted/40 transition-colors cursor-pointer group">
                <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full mr-5 shadow-[0_0_8px_rgba(234,179,8,0.8)]"></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-semibold leading-none group-hover:text-primary transition-colors">Software installation request</p>
                  <p className="text-sm text-muted-foreground">Opened by Mike T. • 5 hours ago</p>
                </div>
                <div className="text-sm font-medium text-yellow-600 bg-yellow-500/10 px-3 py-1 rounded-full">Pending</div>
              </div>
            </div>
            <div className="p-4 border-t border-border/40 bg-muted/10 text-center">
              <Link to="/tickets" className="text-sm font-medium text-primary hover:text-indigo-600 transition-colors flex items-center justify-center gap-2">
                View all tickets <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
