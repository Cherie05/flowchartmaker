import { Navigate, useLocation } from 'react-router-dom';

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isAuthenticated = Boolean(localStorage.getItem('user_email'));

  if (!isAuthenticated) {
    // Redirect to the auth page if not authenticated,
    // saving the current location they were trying to go to
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
