import React, { useContext } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Loading from '../components/Loading';

function homeForRole(role) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'AGENCY') return '/agency/dashboard';
  return '/app';
}

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) return <Loading />;

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  return children || <Outlet />;
}
