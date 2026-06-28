import { useState } from 'react';
import { useSession } from '../lib/auth';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { ShieldCheck, User as UserIcon, Calendar, Mail, Plus } from 'lucide-react';
import { CreateUserForm } from '../components/CreateUserForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function Users() {
  const { data: session, isPending: authPending } = useSession();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);


  const { data: users = [], isLoading: loading, error: queryError } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await axios.get(`${backendUrl}/api/users`, {
        withCredentials: true,
      });
      return response.data as User[];
    },
    enabled: !!session && session.user.role === 'ADMIN',
  });

  const error = queryError ? (queryError as any).response?.data?.error || queryError.message || 'An error occurred' : null;

  // Wait for auth to finish before checking role, otherwise we might redirect too early
  if (!authPending && (!session || session.user.role !== 'ADMIN')) {
    return <Navigate to="/" replace />;
  }



  const showLoader = authPending || loading;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-600" />
            Users Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Manage system users and their roles securely.
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="bg-indigo-600 hover:bg-indigo-600/90 text-primary-foreground">
              <Plus className="w-4 h-4 mr-2" />
              New User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create User</DialogTitle>
            </DialogHeader>
            <CreateUserForm onSuccess={() => setIsModalOpen(false)} />
          </DialogContent>
        </Dialog>
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
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <div className="w-1/4">
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="w-1/4">
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="w-1/4">
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
                  <th scope="col" className="px-6 py-4 font-semibold">User</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Contact</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Role</th>
                  <th scope="col" className="px-6 py-4 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((user) => (
                  <tr 
                    key={user.id} 
                    className="bg-card hover:bg-muted/30 transition-colors duration-200"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-foreground">{user.name}</div>
                          <div className="text-xs text-muted-foreground font-mono mt-0.5">{user.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="w-4 h-4" />
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        user.role === 'ADMIN' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}>
                        {user.role === 'ADMIN' && <ShieldCheck className="w-3 h-3 mr-1" />}
                        {user.role !== 'ADMIN' && <UserIcon className="w-3 h-3 mr-1" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(user.createdAt).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {users.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      No users found.
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
