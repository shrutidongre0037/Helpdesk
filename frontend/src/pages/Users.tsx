import { useSession } from '../lib/auth';
import { Navigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

export default function Users() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <Skeleton className="h-12 w-64 rounded-lg" />
      </div>
    );
  }

  // Check if user is logged in and is an admin.
  // Using 'as any' here if the type definition hasn't been updated with 'role'
  if (!session || (session.user as any).role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-500">
      <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
        Users Management
      </h1>
    </div>
  );
}
