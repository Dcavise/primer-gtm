import React, { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle } from "lucide-react";
import { testSalesforceConnection } from "@/utils/test-salesforce";

export const DatabaseConnectionAlert: React.FC = () => {
  const [connectionStatus, setConnectionStatus] = useState<{
    loading: boolean;
    connected: boolean;
    method: string | null;
    error?: any;
  }>({
    loading: true,
    connected: false,
    method: null,
  });

  useEffect(() => {
    // Test Salesforce connection on component mount
    const checkConnection = async () => {
      try {
        const results = await testSalesforceConnection();
        setConnectionStatus({
          loading: false,
          connected: results.salesforceAccess,
          method: results.usingAdminClient ? "Admin Client" : "Regular Client",
          error: results.salesforceAccess ? null : "Could not access Salesforce data tables",
        });
      } catch (error) {
        setConnectionStatus({
          loading: false,
          connected: false,
          method: null,
          error,
        });
      }
    };

    checkConnection();
  }, []);

  if (connectionStatus.loading) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Checking connection...</AlertTitle>
        <AlertDescription>Verifying connection to Salesforce data tables...</AlertDescription>
      </Alert>
    );
  }

  if (connectionStatus.connected) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <AlertTitle className="text-green-700">Connected to Salesforce Data</AlertTitle>
        <AlertDescription className="text-green-600">
          Connected to Salesforce data tables using {connectionStatus.method}.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Connection failed</AlertTitle>
      <AlertDescription>
        {connectionStatus.error?.message ||
          String(connectionStatus.error) ||
          "Could not access Salesforce data tables"}
      </AlertDescription>
    </Alert>
  );
};
