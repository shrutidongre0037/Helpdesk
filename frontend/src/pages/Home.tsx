import { useSession } from '../lib/auth';
import { Navigate } from 'react-router-dom';

export default function Home() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Optional: Redirect to login if not authenticated
  // if (!session) {
  //   return <Navigate to="/login" replace />;
  // }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="bg-white rounded-lg shadow px-5 py-6 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Welcome to Helpdesk AI
        </h1>
        {session ? (
          <p className="text-lg text-gray-600">
            Hello, {session.user.name}! You are successfully logged in.
          </p>
        ) : (
          <p className="text-lg text-gray-600">
            Please log in to access your dashboard.
          </p>
        )}
      </div>
    </div>
  );
}
