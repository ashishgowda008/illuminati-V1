import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const location = useLocation();
  const storedUserType = localStorage.getItem('userType');
  const storedUsername = localStorage.getItem('username');
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

  // Special handling for admin routes
  if (location.pathname === '/admin') {
    // Check only localStorage for admin routes
    const isAdminAuthenticated = localStorage.getItem('userType') === 'admin' && 
                                 localStorage.getItem('isAuthenticated') === 'true';
    if (!isAdminAuthenticated) {
      return <Navigate to="/adminsignin" state={{ from: location }} replace />;
    }
    return children;
  }

  // Don't redirect if on authentication pages
  if (location.pathname === '/signin' || location.pathname === '/adminsignin') {
    return children;
  }

  // For all other routes, only check localStorage authentication
  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Handle redirection based on userType if on wrong page
  const currentPath = location.pathname;
  if (storedUserType === 'university' && currentPath === '/submit-sponsorship') {
    return <Navigate to="/sponsorships" />;
  }
  if (storedUserType === 'brand' && currentPath === '/sponsorships') {
    return <Navigate to="/submit-sponsorship" />;
  }

  return children;
};

export default ProtectedRoute;

