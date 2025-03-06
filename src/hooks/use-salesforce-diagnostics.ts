
import { useState } from 'react';
import { troubleshootSchemaAccess } from '@/utils/salesforce-access';
import { toast } from 'sonner';

export const useSalesforceDiagnostics = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runDiagnostics = async () => {
    try {
      setIsRunning(true);
      toast.info("Running Salesforce schema diagnostics...");
      
      const diagResults = await troubleshootSchemaAccess();
      
      setResults(diagResults);
      
      if (diagResults.success) {
        toast.success("Diagnostics completed successfully");
      } else {
        toast.error("Diagnostics found connection issues");
      }
      
      return diagResults;
    } catch (error) {
      toast.error("Error running diagnostics");
      console.error("Error during Salesforce diagnostics:", error);
      return { success: false, error };
    } finally {
      setIsRunning(false);
    }
  };

  return {
    runDiagnostics,
    isRunning,
    results
  };
};
