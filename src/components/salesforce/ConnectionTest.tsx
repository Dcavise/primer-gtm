import React, { useState } from "react";
import { testSalesforceConnection, getSampleLeads } from "@/utils/test-salesforce";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Database, User, Table2, List } from "lucide-react";

export function SalesforceConnectionTest() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [leadsData, setLeadsData] = useState<any[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const testResults = await testSalesforceConnection();
      setResults(testResults);
    } catch (err) {
      console.error("Test error:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchSampleLeads = async () => {
    setLeadsLoading(true);
    setError(null);
    try {
      const { success, data, error: leadsError } = await getSampleLeads(5);
      if (success && data) {
        setLeadsData(data);
      } else {
        setError(
          leadsError instanceof Error ? leadsError.message : String(leadsError || "Unknown error")
        );
      }
    } catch (err) {
      console.error("Leads fetch error:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLeadsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Salesforce Connection Test</CardTitle>
        <CardDescription>Test the connection to the Salesforce data source</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Button onClick={runTest} disabled={loading} variant="outline">
              {loading ? "Testing..." : "Test Connection"}
            </Button>

            {results && (
              <Badge variant={results.regularClient.success ? "default" : "destructive"}>
                {results.regularClient.success ? "Connected" : "Failed"}
              </Badge>
            )}
          </div>

          {error && (
            <div className="bg-red-50 p-4 rounded-md mt-4 text-red-800">
              <div className="flex">
                <XCircle className="h-5 w-5 text-red-500 mr-2" />
                <div>
                  <h3 className="text-sm font-medium">Error</h3>
                  <p className="text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {results && (
            <div className="space-y-4 mt-4">
              <div className="border rounded-md p-4">
                <h3 className="text-sm font-medium flex items-center mb-2">
                  <Database className="h-4 w-4 mr-2" />
                  Connection Status
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    {results.regularClient.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 mr-2" />
                    )}
                    <span>Regular Client: </span>
                    <span className="ml-1 font-medium">
                      {results.regularClient.success ? "Connected" : "Failed"}
                    </span>
                  </div>

                  {results.regularClient.error && (
                    <div className="text-xs text-red-600 ml-6">
                      Error:{" "}
                      {results.regularClient.error.message || String(results.regularClient.error)}
                    </div>
                  )}
                </div>
              </div>

              <div className="border rounded-md p-4">
                <h3 className="text-sm font-medium flex items-center mb-2">
                  <Table2 className="h-4 w-4 mr-2" />
                  Salesforce Tables
                </h3>
                {results.tables && results.tables.length > 0 ? (
                  <ul className="space-y-1">
                    {results.tables.map((table: string) => (
                      <li key={table} className="text-sm flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                        {table}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">No tables found</p>
                )}
              </div>

              <div className="border rounded-md p-4">
                <h3 className="text-sm font-medium flex items-center mb-2">
                  <List className="h-4 w-4 mr-2" />
                  Test Sample Data
                </h3>
                <Button
                  onClick={fetchSampleLeads}
                  disabled={leadsLoading || !results.regularClient.success}
                  variant="outline"
                  size="sm"
                >
                  {leadsLoading ? "Loading..." : "Fetch Sample Leads"}
                </Button>

                {leadsData.length > 0 && (
                  <div className="mt-4 overflow-auto">
                    <table className="min-w-full text-xs">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">First Name</th>
                          <th className="text-left p-2">Last Name</th>
                          <th className="text-left p-2">Email</th>
                          <th className="text-left p-2">Company</th>
                          <th className="text-left p-2">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {leadsData.map((lead, index) => (
                          <tr key={index} className="border-b">
                            <td className="p-2">{lead.first_name}</td>
                            <td className="p-2">{lead.last_name}</td>
                            <td className="p-2">{lead.email}</td>
                            <td className="p-2">{lead.company}</td>
                            <td className="p-2">{lead.status}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
