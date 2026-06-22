import { useSession } from '../lib/auth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Plus, Ticket, Users, Clock } from 'lucide-react';

export default function Home() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <Skeleton className="h-12 w-64 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Welcome to Helpdesk AI
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            Hello, <span className="font-semibold text-foreground">{session.user.name}</span>! Here's an overview of your workspace.
          </p>
        </div>
        <Button className="bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 shadow-md">
          <Plus className="mr-2 h-4 w-4" /> New Ticket
        </Button>
      </div>

      <>
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="hover:shadow-md transition-shadow border-border/50 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                <Ticket className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">128</div>
                <p className="text-xs text-muted-foreground mt-1">
                  +14% from last month
                </p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-md transition-shadow border-border/50 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">32</div>
                <p className="text-xs text-muted-foreground mt-1">
                  +2 this week
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow border-border/50 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Resolution</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.2h</div>
                <p className="text-xs text-muted-foreground mt-1">
                  -1.5h from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity placeholder */}
          <Card className="border-border/50 bg-white/50 dark:bg-zinc-950/50 backdrop-blur-sm shadow-sm">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                You have 3 tickets that need your attention.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center p-4 border rounded-lg bg-background/50 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-4"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Cannot access email</p>
                    <p className="text-sm text-muted-foreground">Opened by Sarah J. • 2 hours ago</p>
                  </div>
                  <div className="text-sm text-muted-foreground">Open</div>
                </div>
                <div className="flex items-center p-4 border rounded-lg bg-background/50 hover:bg-muted/50 transition-colors cursor-pointer">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-4"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Software installation request</p>
                    <p className="text-sm text-muted-foreground">Opened by Mike T. • 5 hours ago</p>
                  </div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
    </div>
  );
}
