
import React, { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SyncErrorAlert } from "@/components/salesforce/SyncErrorAlert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCw } from "lucide-react";

interface SyncFormData {
  spreadsheetId: string;
  sheetName: string;
  range: string;
  keyColumn: string;
}

export const GoogleSheetsDataSync: React.FC = () => {
  const [formData, setFormData] = useState<SyncFormData>({
    spreadsheetId: "1Lz5_CWhpQ1rJiIhThRoPRC1rgBhXyn2AIUsZO-hvVtA", // Default to the fellows spreadsheet
    sheetName: "Sheet1",
    range: "",
    keyColumn: ""
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const syncData = async () => {
    try {
      setIsSyncing(true);
      setError(null);

      const { spreadsheetId, sheetName, range, keyColumn } = formData;
      
      // Validate required fields
      if (!spreadsheetId || !sheetName) {
        throw new Error("Spreadsheet ID and Sheet Name are required");
      }

      // Prepare sync parameters
      const params: any = {
        spreadsheetId,
        sheetName
      };

      // Add optional parameters if provided
      if (range) params.range = range;
      if (keyColumn) params.keyColumn = keyColumn;

      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('sync-google-sheets-data', {
        body: params
      });

      if (error) {
        throw new Error(`Function error: ${error.message}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Unknown error occurred');
      }

      // Update last synced time
      setLastSynced(new Date().toISOString());
      
      // Show success toast
      toast({
        title: "Data synced successfully",
        description: data.message || `Processed ${data.result.processed} rows of data`,
      });

    } catch (err: any) {
      console.error("Error syncing data:", err);
      setError(err.message || "An unknown error occurred");
      
      toast({
        variant: "destructive",
        title: "Sync failed",
        description: err.message || "Failed to sync data from Google Sheets",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Google Sheets Data Sync</CardTitle>
        <CardDescription>
          Sync data from Google Sheets to Supabase
          {lastSynced && (
            <div className="text-sm mt-1">
              Last synced: {new Date(lastSynced).toLocaleString()}
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <SyncErrorAlert error={error} />}
        
        <div className="space-y-2">
          <Label htmlFor="spreadsheetId">Spreadsheet ID</Label>
          <Input
            id="spreadsheetId"
            name="spreadsheetId"
            value={formData.spreadsheetId}
            onChange={handleInputChange}
            placeholder="1Lz5_CWhpQ1rJiIhThRoPRC1rgBhXyn2AIUsZO-hvVtA"
          />
          <p className="text-sm text-muted-foreground">
            The ID from the Google Sheet URL: https://docs.google.com/spreadsheets/d/[SPREADSHEET_ID]/edit
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="sheetName">Sheet Name</Label>
          <Input
            id="sheetName"
            name="sheetName"
            value={formData.sheetName}
            onChange={handleInputChange}
            placeholder="Sheet1"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="range">Range (Optional)</Label>
          <Input
            id="range"
            name="range"
            value={formData.range}
            onChange={handleInputChange}
            placeholder="A1:Z100"
          />
          <p className="text-sm text-muted-foreground">
            E.g., Sheet1!A1:Z100. If left empty, all data will be fetched.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="keyColumn">Key Column (Optional)</Label>
          <Input
            id="keyColumn"
            name="keyColumn"
            value={formData.keyColumn}
            onChange={handleInputChange}
            placeholder="ID"
          />
          <p className="text-sm text-muted-foreground">
            Column header to use as a unique identifier for each row
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={syncData} 
          disabled={isSyncing || !formData.spreadsheetId || !formData.sheetName}
          className="w-full"
        >
          {isSyncing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Syncing Data...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Sync Data
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
