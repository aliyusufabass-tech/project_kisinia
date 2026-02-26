import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, requiredRole = null }) {
  const token = localStorage.getItem('access_token');
  const role = localStorage.getItem('role');
  const userData = localStorage.getItem('user');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Check if user is superuser and trying to access admin
  if (requiredRole === 'ADMIN' && userData) {
    const user = JSON.parse(userData);
    if (user.is_superuser) {
      return children;
    }
  }

  if (requiredRole && role !== requiredRole) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
