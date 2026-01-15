import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Activity } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireSuperuser?: boolean;
}

/**
 * Loading spinner component
 */
function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-primary to-accent glow-primary">
          <Activity className="w-8 h-8 text-primary-foreground animate-pulse" />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-muted-foreground">Carregando...</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Protected route component
 * - Redirects to login if not authenticated
 * - Optionally requires superuser role
 * - Shows loading state while checking auth
 */
export function ProtectedRoute({ children, requireSuperuser = false }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isSuperuser } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Requires superuser but user is not superuser
  if (requireSuperuser && !isSuperuser) {
    return <Navigate to="/farm" replace />;
  }

  return <>{children}</>;
}

export default ProtectedRoute;
