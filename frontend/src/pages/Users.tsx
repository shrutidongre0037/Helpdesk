import { useSession } from '../lib/auth';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';
import { ShieldCheck, User as UserIcon, Calendar, Mail } from 'lucide-react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function Users() {
  const { data: session, isPending: authPending } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session || session.user.role !== 'ADMIN') return;

    const fetchUsers = async () => {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
        const response = await fetch(`${backendUrl}/api/users`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        setUsers(data);
      } catch (err: any) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [session]);

  if (authPending) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <Skeleton className="h-12 w-64 rounded-lg" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  // Role is properly typed via createAuthClient<typeof auth> in lib/auth.ts
  if (!session || session.user.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

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
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
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
