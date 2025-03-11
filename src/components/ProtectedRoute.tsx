import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { DatabaseConnectionAlert } from "./salesforce/DatabaseConnectionAlert";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  // Temporarily bypass authentication checks
  // const { user, loading, databaseConnected, schemaStatus } = useAuth();

  // Always render children without authentication checks
  return (
    <>
      {/* Authentication is temporarily disabled */}
      {children}
    </>
  );
};

export default ProtectedRoute;
