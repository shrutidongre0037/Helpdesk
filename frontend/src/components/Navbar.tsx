import { Link, useNavigate } from 'react-router-dom';
import { useSession, signOut } from '../lib/auth';
import { LogOut, User, Settings, LayoutDashboard, Users } from 'lucide-react';
import { Role } from '@helpdesk/core';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Navbar() {
  const { data: session, isPending } = useSession();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600 dark:to-indigo-400 mr-8">
                Helpdesk AI
              </Link>
            </div>
            {session && (
              <div className="hidden sm:flex sm:items-center sm:space-x-8">
                <Link
                  to="/tickets"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Tickets
                </Link>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isPending ? (
              <div className="flex items-center space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
              </div>
            ) : session ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full focus-visible:ring-0 focus-visible:ring-offset-0">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/20 transition-all hover:ring-primary/50">
                      <AvatarImage src="" alt={session.user.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {session.user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link to="/" className="flex items-center w-full">
                      <LayoutDashboard className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  {session && session.user.role === Role.ADMIN && (
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link to="/users" className="flex items-center w-full">
                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>Manage Users</span>
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button asChild variant="default" className="font-medium bg-gradient-to-r from-primary to-indigo-600 hover:opacity-90 transition-opacity">
                <Link to="/login">
                  Log in
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
