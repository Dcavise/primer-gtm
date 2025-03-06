
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingState } from './LoadingState';
import { DatabaseConnectionAlert } from './salesforce/DatabaseConnectionAlert';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading, databaseConnected, schemaStatus } = useAuth();
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
  
  // If the user is authenticated but database isn't connected, show the alert
  // but still render the protected content (with mock data fallbacks)
  return (
    <>
      {!databaseConnected && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <DatabaseConnectionAlert 
            status="error"
            schemaStatus={schemaStatus}
          />
        </div>
      )}
      {children}
    </>
  );
};

export default ProtectedRoute;
