
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingState } from './LoadingState';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    // Show a loading spinner with improved UI
    return (
      <div className="flex items-center justify-center h-screen">
        <LoadingState showSpinner={true} message="Authenticating..." />
      </div>
    );
  }
  
  if (!user) {
    // Redirect to the auth page if the user is not authenticated
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  // If the user is authenticated, render the protected content
  return <>{children}</>;
};

export default ProtectedRoute;
