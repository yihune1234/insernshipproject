import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, role, isHydrated } = useAuthStore();
  const location = useLocation();

  // Wait for store to rehydrate from localStorage
  if (!isHydrated) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    const { getDashboard } = useAuthStore.getState();
    return <Navigate to={getDashboard()} replace />;
  }

  return children;
}

export function GuestRoute({ children }) {
  const { isAuthenticated, getDashboard, isHydrated } = useAuthStore();
  
  // Wait for store to rehydrate from localStorage
  if (!isHydrated) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  if (isAuthenticated) {
    return <Navigate to={getDashboard()} replace />;
  }
  return children;
}
