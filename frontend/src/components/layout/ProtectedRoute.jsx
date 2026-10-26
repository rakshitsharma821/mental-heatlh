import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Loader from '../common/Loader';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader message="Entering your sanctuary..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && Array.isArray(allowedRoles) && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin' || user.role === 'super_admin') {
      return <Navigate to="/admin" replace />;
    }
    if (user.role === 'therapist') {
      return <Navigate to="/therapist" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
