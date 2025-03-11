import React, { useState } from "react";
import { supabase } from "@/integrations/supabase-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const SchemaDebugger = () => {
  const [schemaInfo, setSchemaInfo] = useState<any>(null);
  const [tableInfo, setTableInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schemaName, setSchemaName] = useState("public");
  const [tableName, setTableName] = useState("lead");

  const checkSchema = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.rpc(
        "check_schema_tables",
        { schema_name: schemaName },
      );

      if (fetchError) throw fetchError;

      setSchemaInfo(data[0]);
    } catch (err) {
      console.error("Error checking schema:", err);
      setError(err instanceof Error ? err.message : "Failed to check schema");
    } finally {
      setLoading(false);
    }
  };

  const describeTable = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.rpc("describe_table", {
        schema_name: schemaName,
        table_name: tableName,
      });

      if (fetchError) throw fetchError;

      setTableInfo(data);
    } catch (err) {
      console.error("Error describing table:", err);
      setError(err instanceof Error ? err.message : "Failed to describe table");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Database Schema Debugger</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="schema">
          <TabsList className="mb-4">
            <TabsTrigger value="schema">Check Schema</TabsTrigger>
            <TabsTrigger value="table">Describe Table</TabsTrigger>
          </TabsList>

          <TabsContent value="schema">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="schema-name">Schema Name</Label>
                  <Input
                    id="schema-name"
                    value={schemaName}
                    onChange={(e) => setSchemaName(e.target.value)}
                    placeholder="e.g. salesforce"
                  />
                </div>
                <Button
                  onClick={checkSchema}
                  disabled={loading}
                  className="mt-3"
                >
                  {loading ? "Checking..." : "Check Schema"}
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {schemaInfo && (
                <div className="border rounded-md p-4 bg-muted/50">
                  <h3 className="font-medium mb-2">
                    Schema: {schemaInfo.schema_name}
                  </h3>
                  <p>
                    Schema exists: {schemaInfo.schema_exists ? "Yes" : "No"}
                  </p>
                  {schemaInfo.schema_exists && schemaInfo.tables && (
                    <div className="mt-2">
                      <h4 className="font-medium mb-1">
                        Tables ({schemaInfo.tables.length}):
                      </h4>
                      <ul className="text-sm list-disc pl-5 grid grid-cols-2 md:grid-cols-3 gap-1">
                        {schemaInfo.tables.map((table: string) => (
                          <li key={table}>{table}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {schemaInfo.schema_exists &&
                    (!schemaInfo.tables || schemaInfo.tables.length === 0) && (
                      <p className="text-muted-foreground">
                        No tables found in this schema.
                      </p>
                    )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="table">
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="schema-name-table">Schema Name</Label>
                  <Input
                    id="schema-name-table"
                    value={schemaName}
                    onChange={(e) => setSchemaName(e.target.value)}
                    placeholder="e.g. salesforce"
                  />
                </div>
                <div className="grid w-full max-w-sm items-center gap-1.5">
                  <Label htmlFor="table-name">Table Name</Label>
                  <Input
                    id="table-name"
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    placeholder="e.g. lead"
                  />
                </div>
                <Button
                  onClick={describeTable}
                  disabled={loading}
                  className="mt-auto"
                >
                  {loading ? "Loading..." : "Describe Table"}
                </Button>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {tableInfo && tableInfo.length > 0 ? (
                <div className="border rounded-md overflow-x-auto">
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Column
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Nullable
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-card divide-y divide-border">
                      {tableInfo.map((column: any, index: number) => (
                        <tr
                          key={index}
                          className={
                            index % 2 === 0 ? "bg-card" : "bg-muted/20"
                          }
                        >
                          <td className="px-4 py-2 text-sm">
                            {column.column_name}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {column.data_type}
                          </td>
                          <td className="px-4 py-2 text-sm">
                            {column.is_nullable === "YES" ? "Yes" : "No"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : tableInfo ? (
                <p className="text-muted-foreground">
                  No columns found for this table.
                </p>
              ) : null}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SchemaDebugger;
