import React, { useState } from "react";
import { supabase } from "@/integrations/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, X, AlertCircle } from "lucide-react";

const SimpleDatabaseTest = () => {
  const [loading, setLoading] = useState(false);
  const [publicSchemaExists, setPublicSchemaExists] = useState<boolean | null>(
    null,
  );
  const [salesforceSchemaExists, setSalesforceSchemaExists] = useState<
    boolean | null
  >(null);
  const [publicTables, setPublicTables] = useState<string[]>([]);
  const [salesforceTables, setSalesforceTables] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [diagResults, setDiagResults] = useState<any>(null);

  const checkDatabase = async () => {
    try {
      setLoading(true);
      setError(null);
      setDiagResults(null);

      // Try to get schema information using the standard Postgres function
      const { data: publicResult, error: publicError } = await supabase.rpc(
        "test_schema_exists",
        {
          schema_name: "public",
        },
      );

      if (publicError) {
        // If the RPC fails, that itself is useful diagnostic information
        console.error("Public schema check failed:", publicError);
        setPublicSchemaExists(false);
        setError(`Error checking public schema: ${publicError.message}`);
      } else {
        setPublicSchemaExists(publicResult?.exists || false);
        setPublicTables(publicResult?.tables || []);
      }

      // Check fivetran_views schema
      const { data: salesforceResult, error: salesforceError } =
        await supabase.rpc("test_schema_exists", {
          schema_name: "fivetran_views",
        });

      if (salesforceError) {
        console.error("Fivetran_views schema check failed:", salesforceError);
        setSalesforceSchemaExists(false);
        if (!publicError) {
          setError(
            `Error checking fivetran_views schema: ${salesforceError.message}`,
          );
        }
      } else {
        setSalesforceSchemaExists(salesforceResult?.exists || false);
        setSalesforceTables(salesforceResult?.tables || []);
      }
    } catch (err) {
      console.error("Database check error:", err);
      setError(err instanceof Error ? err.message : "Failed to check database");
    } finally {
      setLoading(false);
    }
  };

  const runDiagnostics = async () => {
    try {
      setLoading(true);
      setError(null);
      setDiagResults(null);

      // Try to call the functions we created earlier to see if they exist
      const diagnoses = [];

      // 1. Check if we can query public.check_schema_tables
      const { data: schemaCheckData, error: schemaCheckError } =
        await supabase.rpc("check_schema_tables", { schema_name: "public" });

      if (schemaCheckError) {
        diagnoses.push({
          function: "check_schema_tables",
          exists: false,
          error: schemaCheckError.message,
        });
      } else {
        diagnoses.push({
          function: "check_schema_tables",
          exists: true,
          result: schemaCheckData,
        });
      }

      // 2. Check if we can query public.describe_table
      const { data: describeData, error: describeError } = await supabase.rpc(
        "describe_table",
        {
          schema_name: "public",
          table_name: "campuses",
        },
      );

      if (describeError) {
        diagnoses.push({
          function: "describe_table",
          exists: false,
          error: describeError.message,
        });
      } else {
        diagnoses.push({
          function: "describe_table",
          exists: true,
          result: describeData,
        });
      }

      // 3. Try to get schema names through a direct RPC if it exists
      const { data: schemaList, error: schemaListError } =
        await supabase.rpc("list_schemas");

      if (schemaListError) {
        diagnoses.push({
          function: "list_schemas",
          exists: false,
          error: schemaListError.message,
        });
      } else {
        diagnoses.push({
          function: "list_schemas",
          exists: true,
          result: schemaList,
        });
      }

      setDiagResults(diagnoses);
    } catch (err) {
      console.error("Diagnostics error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to run diagnostics",
      );
    } finally {
      setLoading(false);
    }
  };

  const checkFunctionExists = async () => {
    try {
      setLoading(true);
      setError(null);

      setDiagResults(
        "Please create the test_schema_exists function in the Supabase SQL Editor using the SQL below:\n\n" +
          "CREATE OR REPLACE FUNCTION public.test_schema_exists(schema_name text)\n" +
          "RETURNS json\n" +
          "LANGUAGE plpgsql\n" +
          "SECURITY DEFINER\n" +
          "AS $$\n" +
          "DECLARE\n" +
          "  schema_exists boolean;\n" +
          "  schema_tables text[];\n" +
          "BEGIN\n" +
          "  SELECT EXISTS(\n" +
          "    SELECT 1 FROM information_schema.schemata\n" +
          "    WHERE schema_name = $1\n" +
          "  ) INTO schema_exists;\n" +
          "  \n" +
          "  IF schema_exists THEN\n" +
          "    SELECT array_agg(table_name::text)\n" +
          "    FROM information_schema.tables\n" +
          "    WHERE table_schema = $1\n" +
          "    AND table_type = 'BASE TABLE'\n" +
          "    INTO schema_tables;\n" +
          "  END IF;\n" +
          "  \n" +
          "  RETURN json_build_object(\n" +
          "    'exists', schema_exists,\n" +
          "    'tables', COALESCE(schema_tables, ARRAY[]::text[])\n" +
          "  );\n" +
          "END;\n" +
          "$$;\n" +
          "COMMENT ON FUNCTION public.test_schema_exists IS 'Check if a schema exists and list its tables';\n" +
          "GRANT EXECUTE ON FUNCTION public.test_schema_exists TO authenticated;\n" +
          "GRANT EXECUTE ON FUNCTION public.test_schema_exists TO service_role;",
      );
    } catch (err) {
      console.error("Function check error:", err);
      setError(err instanceof Error ? err.message : "Failed to check function");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Database Schema Test</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={checkDatabase} disabled={loading}>
              {loading ? "Checking..." : "Check Schemas"}
            </Button>
            <Button
              onClick={runDiagnostics}
              disabled={loading}
              variant="outline"
            >
              Run Diagnostics
            </Button>
            <Button
              onClick={checkFunctionExists}
              disabled={loading}
              variant="secondary"
            >
              Show Required SQL
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Public Schema Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>Public Schema</span>
                  {publicSchemaExists === null ? (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  ) : publicSchemaExists ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {publicSchemaExists === null ? (
                  <p className="text-muted-foreground">Not checked yet</p>
                ) : publicSchemaExists ? (
                  <div>
                    <p className="text-green-600 font-medium">
                      Public schema exists
                    </p>
                    {publicTables.length > 0 ? (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">
                          Tables ({publicTables.length}):
                        </p>
                        <ul className="text-sm list-disc pl-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-1">
                          {publicTables.slice(0, 10).map((table) => (
                            <li key={table}>{table}</li>
                          ))}
                          {publicTables.length > 10 && (
                            <li>...and {publicTables.length - 10} more</li>
                          )}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-yellow-600 mt-2">No tables found</p>
                    )}
                  </div>
                ) : (
                  <p className="text-red-600">Public schema not found</p>
                )}
              </CardContent>
            </Card>

            {/* Salesforce Schema Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex justify-between items-center">
                  <span>Fivetran Views Schema</span>
                  {salesforceSchemaExists === null ? (
                    <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  ) : salesforceSchemaExists ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <X className="h-4 w-4 text-red-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {salesforceSchemaExists === null ? (
                  <p className="text-muted-foreground">Not checked yet</p>
                ) : salesforceSchemaExists ? (
                  <div>
                    <p className="text-green-600 font-medium">
                      Fivetran Views schema exists
                    </p>
                    {salesforceTables.length > 0 ? (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">
                          Tables ({salesforceTables.length}):
                        </p>
                        <ul className="text-sm list-disc pl-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-1">
                          {salesforceTables.slice(0, 10).map((table) => (
                            <li key={table}>{table}</li>
                          ))}
                          {salesforceTables.length > 10 && (
                            <li>...and {salesforceTables.length - 10} more</li>
                          )}
                        </ul>
                      </div>
                    ) : (
                      <p className="text-yellow-600 mt-2">No tables found</p>
                    )}
                  </div>
                ) : (
                  <p className="text-red-600">
                    Fivetran Views schema not found
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {diagResults && (
            <Card>
              <CardHeader>
                <CardTitle>Diagnostic Results</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-slate-100 dark:bg-slate-800 p-4 rounded-md text-xs overflow-auto max-h-60">
                  {typeof diagResults === "string"
                    ? diagResults
                    : JSON.stringify(diagResults, null, 2)}
                </pre>
              </CardContent>
            </Card>
          )}

          <Alert>
            <AlertTitle>Database Troubleshooting</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>
                  Click "Show Required SQL" to see the SQL needed to create the
                  test function
                </li>
                <li>
                  Add this SQL function to your Supabase project via the SQL
                  Editor
                </li>
                <li>
                  Verify your Supabase connection credentials in .env file
                </li>
                <li>
                  Check permissions for the authenticated and service_role
                </li>
                <li>
                  RLS (Row Level Security) policies might restrict access to
                  system catalogs
                </li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};

export default SimpleDatabaseTest;
