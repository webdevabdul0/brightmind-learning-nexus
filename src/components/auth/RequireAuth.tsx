
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/providers/AuthProvider';

interface RequireAuthProps {
  children: React.ReactNode;
  allowedRoles?: Array<'student' | 'teacher' | 'admin'>;
}

const RequireAuth = ({ children, allowedRoles }: RequireAuthProps) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-brightmind-purple"></div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && profile?.role && !allowedRoles.includes(profile.role as 'student' | 'teacher' | 'admin')) {
    // User doesn't have permission - redirect to unauthorized page or dashboard
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default RequireAuth;
