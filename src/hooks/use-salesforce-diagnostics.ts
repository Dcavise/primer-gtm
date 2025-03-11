import { useState } from "react";
import { toast } from "sonner";
import {
  testConnection,
  troubleshootSchemaAccess,
  testCrossSchemaMethods,
} from "@/utils/salesforce-access";
import { logger } from "@/utils/logger";

export const useSalesforceDiagnostics = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<any>(null);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setError(null);

    try {
      toast.info("Starting Salesforce diagnostics...");
      logger.info("Running Salesforce diagnostics");

      // Step 1: Test basic connection
      const connectionTest = await testConnection();
      if (!connectionTest.success) {
        setError(
          "Connection to Supabase failed. Check your Supabase URL and key.",
        );
        toast.error("Connection to Supabase failed");
        setResults({ connection: connectionTest });
        return;
      }

      // Step 2: Check schema access
      const schemaAccess = await troubleshootSchemaAccess();

      // Step 3: Test cross-schema methods
      const methodTests = await testCrossSchemaMethods();

      // Compile results
      const diagnosticResults = {
        connection: connectionTest,
        schemaAccess,
        methodTests,
        timestamp: new Date().toISOString(),
      };

      setResults(diagnosticResults);

      if (schemaAccess.success && schemaAccess.salesforceAccessible) {
        toast.success("Salesforce schema is accessible!");
      } else {
        toast.warning(
          "Limited access to Salesforce schema. Check the results for details.",
        );
      }

      logger.info("Salesforce diagnostics complete", diagnosticResults);
    } catch (err) {
      setError(err);
      toast.error("Error running Salesforce diagnostics");
      logger.error("Error in runDiagnostics:", err);
    } finally {
      setIsRunning(false);
    }
  };

  return {
    runDiagnostics,
    isRunning,
    results,
    error,
    hasAccess: results?.schemaAccess?.salesforceAccessible || false,
  };
};
