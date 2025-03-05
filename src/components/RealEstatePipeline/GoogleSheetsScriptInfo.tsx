
import React from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Copy, ExternalLink, FileCode, FileText } from 'lucide-react';

// The spreadsheet ID from the existing code
const SPREADSHEET_ID = "1sNaNYFCYEEPmh8t_uISJ9av2HatheCdce3ssRkgOFYU";

export const GoogleSheetsScriptInfo = () => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const googleSheetsUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`;
  const googleAppsScriptUrl = `https://script.google.com/home/projects/create`;
  
  // This is the updated Google Apps Script code that will be provided to the user
  const appsScriptCode = `// Function to push data from Google Sheets to Supabase
function syncToSupabase() {
  // Configuration
  const supabaseEndpoint = "https://pudncilureqpzxrxfupr.supabase.co/functions/v1/sheets-to-supabase";
  const apiKey = "YOUR_API_KEY_HERE"; // Replace with the API key set in Supabase
  const clearExistingData = true;
  const spreadsheetId = "${SPREADSHEET_ID}"; // Use the specific spreadsheet ID
  
  try {
    // Get the spreadsheet by ID instead of using getActiveSpreadsheet
    const ss = SpreadsheetApp.openById(spreadsheetId);
    if (!ss) {
      throw new Error("Could not open the specified spreadsheet. Check the spreadsheet ID.");
    }
    
    // Get the first sheet
    const sheet = ss.getSheets()[0];
    if (!sheet) {
      throw new Error("No sheets found in the spreadsheet.");
    }
    
    Logger.log("Successfully opened spreadsheet and first sheet");
    
    // Get all data including headers
    const data = sheet.getDataRange().getValues();
    
    if (!data || data.length < 2) {
      throw new Error("Spreadsheet has insufficient data (needs at least headers and one row)");
    }
    
    // Extract headers (first row)
    const headers = data[0];
    Logger.log("Headers: " + headers.join(", "));
    
    // Process the rest of the rows
    const properties = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row.some(cell => cell !== "")) { // Skip completely empty rows
        const property = {};
        
        // Map each column to its corresponding header
        for (let j = 0; j < headers.length; j++) {
          if (headers[j] && headers[j].trim() !== "") {
            // Convert header to snake_case for Supabase
            const headerKey = headers[j]
              .toLowerCase()
              .replace(/\\s+/g, "_")
              .replace(/[^a-z0-9_]/g, "");
            
            // Special handling for boolean values
            if (row[j] === "TRUE" || row[j] === "Yes" || row[j] === "Y") {
              property[headerKey] = true;
            } else if (row[j] === "FALSE" || row[j] === "No" || row[j] === "N") {
              property[headerKey] = false;
            } else if (headerKey === "lat" || headerKey === "lon") {
              // Convert lat/lon to numbers
              property[headerKey] = row[j] ? Number(row[j]) : null;
            } else {
              property[headerKey] = row[j] || null;
            }
          }
        }
        
        // Only add the property if it has some data
        if (Object.keys(property).length > 0) {
          properties.push(property);
        }
      }
    }
    
    Logger.log("Processed " + properties.length + " properties from the spreadsheet");
    
    // Prepare the payload
    const payload = {
      apiKey: apiKey,
      properties: properties,
      clearExisting: clearExistingData
    };
    
    // Send data to Supabase
    const options = {
      'method': 'post',
      'contentType': 'application/json',
      'payload': JSON.stringify(payload)
    };
    
    Logger.log("Sending data to Supabase...");
    
    // Make the request
    const response = UrlFetchApp.fetch(supabaseEndpoint, options);
    const result = JSON.parse(response.getContentText());
    
    // Log result
    Logger.log("Sync result: " + JSON.stringify(result));
    
    // Show result to user
    if (result.success) {
      SpreadsheetApp.getUi().alert(
        "Sync Complete", 
        "Successfully synced " + result.inserted + " real estate records to the database.",
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } else {
      SpreadsheetApp.getUi().alert(
        "Sync Failed", 
        "Error: " + (result.error || "Unknown error"),
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    }
    
    return result;
  } catch (e) {
    const errorMsg = "Error: " + e.toString();
    Logger.log(errorMsg);
    
    try {
      SpreadsheetApp.getUi().alert(
        "Sync Failed", 
        errorMsg,
        SpreadsheetApp.getUi().ButtonSet.OK
      );
    } catch (uiError) {
      Logger.log("Could not show UI alert: " + uiError.toString());
    }
    
    return { success: false, error: errorMsg };
  }
}

// Add menu to spreadsheet UI
function onOpen() {
  try {
    Logger.log("Running onOpen function");
    const spreadsheetId = "${SPREADSHEET_ID}";
    const ss = SpreadsheetApp.openById(spreadsheetId);
    
    if (!ss) {
      Logger.log("Could not open spreadsheet with ID: " + spreadsheetId);
      return;
    }
    
    Logger.log("Successfully opened spreadsheet, creating menu");
    
    // Get UI properly - using SpreadsheetApp.getUi() which is the correct method
    // Instead of trying to get UI from the spreadsheet object
    let ui;
    try {
      // This is the correct way to access the UI in a bound script
      ui = SpreadsheetApp.getUi();
    } catch (uiError) {
      Logger.log("Could not get UI via SpreadsheetApp.getUi(): " + uiError.toString());
      return;
    }
    
    if (!ui) {
      Logger.log("UI object is null or undefined");
      return;
    }
    
    // Create the menu
    ui.createMenu('Supabase Sync')
      .addItem('Sync to Database', 'syncToSupabase')
      .addToUi();
    Logger.log("Menu created successfully");
  } catch (e) {
    Logger.log("Error in onOpen: " + e.toString());
  }
}

// Function to run without UI for testing
function testConnection() {
  try {
    Logger.log("Testing connection to spreadsheet");
    const spreadsheetId = "${SPREADSHEET_ID}";
    const ss = SpreadsheetApp.openById(spreadsheetId);
    
    if (!ss) {
      Logger.log("Could not open spreadsheet with ID: " + spreadsheetId);
      return "Failed: Could not open spreadsheet";
    }
    
    const sheet = ss.getSheets()[0];
    if (!sheet) {
      Logger.log("No sheets found in the spreadsheet");
      return "Failed: No sheets found";
    }
    
    const name = ss.getName();
    const sheetName = sheet.getName();
    const rowCount = sheet.getLastRow();
    
    Logger.log("Connection successful!");
    Logger.log("Spreadsheet name: " + name);
    Logger.log("First sheet name: " + sheetName);
    Logger.log("Row count: " + rowCount);
    
    return "Success! Connected to spreadsheet: " + name + ", sheet: " + sheetName + " with " + rowCount + " rows";
  } catch (e) {
    const errorMsg = "Error testing connection: " + e.toString();
    Logger.log(errorMsg);
    return errorMsg;
  }
}

// Optional: Add this function to manage permissions
function checkPermissions() {
  DriveApp.getFiles(); // This will trigger authorization
  SpreadsheetApp.openById("${SPREADSHEET_ID}");
  Logger.log("Permissions granted successfully");
  return "Permissions check complete";
}`;

// Instructions for setting up the Apps Script - updated with more detailed steps
const setupInstructions = `
1. Open your Google Sheet at the link below
2. Click on Extensions > Apps Script
3. In the Apps Script editor, paste the provided code
4. Replace "YOUR_API_KEY_HERE" with the actual API key you set in Supabase
5. Save the project (give it a name like "SupabaseSync")
6. Run the "checkPermissions" function first (select it from the dropdown above the editor)
   - Click "Review Permissions" and grant access when prompted
7. Then run the "testConnection" function to verify it can access your spreadsheet
   - Check the Execution log to see if it connected successfully
8. Finally, run the "onOpen" function to create the menu in your Google Sheet
9. Go back to your Google Sheet and refresh the page
10. You should now see a "Supabase Sync" menu item
11. Click it and select "Sync to Database" to run the sync
`;

return (
  <Card className="mb-6">
    <CardHeader>
      <CardTitle className="flex items-center">
        <FileCode className="mr-2 h-5 w-5 text-blue-500" />
        Google Sheets Script Method
      </CardTitle>
      <CardDescription>
        A direct approach to sync data from Google Sheets to your database
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start">
        <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-medium">Important: Setup Required</p>
          <p>You need to set up a Google Apps Script in your spreadsheet and configure an API key to use this method.</p>
        </div>
      </div>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="setup">Setup Instructions</TabsTrigger>
          <TabsTrigger value="code">Script Code</TabsTrigger>
          <TabsTrigger value="apikey">API Key Setup</TabsTrigger>
        </TabsList>
        
        <TabsContent value="setup" className="p-4 border rounded-md mt-4 bg-gray-50">
          <h3 className="text-lg font-medium mb-2">Setup Instructions</h3>
          <div className="flex space-x-4 mb-4">
            <Button variant="outline" size="sm" onClick={() => window.open(googleSheetsUrl, '_blank')}>
              <ExternalLink className="mr-1 h-4 w-4" />
              Open Google Sheet
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.open(googleAppsScriptUrl, '_blank')}>
              <ExternalLink className="mr-1 h-4 w-4" />
              Open Apps Script
            </Button>
          </div>
          <pre className="whitespace-pre-wrap text-sm bg-white p-3 rounded border">
            {setupInstructions}
          </pre>
        </TabsContent>
        
        <TabsContent value="code" className="relative p-4 border rounded-md mt-4 bg-gray-50">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-medium">Google Apps Script Code</h3>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => copyToClipboard(appsScriptCode)}
            >
              <Copy className="mr-1 h-4 w-4" />
              Copy Code
            </Button>
          </div>
          <pre className="overflow-auto max-h-80 text-xs bg-white p-3 rounded border">
            {appsScriptCode}
          </pre>
        </TabsContent>
        
        <TabsContent value="apikey" className="p-4 border rounded-md mt-4 bg-gray-50">
          <h3 className="text-lg font-medium mb-2">API Key Setup</h3>
          <p className="mb-3 text-sm">
            To secure communication between Google Sheets and Supabase, you need to set an API key:
          </p>
          <ol className="list-decimal list-inside text-sm space-y-2">
            <li>Go to the Supabase Edge Function secrets page</li>
            <li>Add a new secret with the name <code className="bg-gray-100 px-1">SHEETS_API_KEY</code></li>
            <li>Set a secure, random value for the key</li>
            <li>Use this same value in your Google Apps Script where it says <code className="bg-gray-100 px-1">YOUR_API_KEY_HERE</code></li>
          </ol>
          <div className="mt-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.open('https://supabase.com/dashboard/project/pudncilureqpzxrxfupr/settings/functions', '_blank')}
            >
              <ExternalLink className="mr-1 h-4 w-4" />
              Go to Supabase Secrets
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </CardContent>
    <CardFooter className="bg-gray-50 text-sm text-gray-600">
      <p>
        This method uses Google Apps Script to directly push data from your spreadsheet to Supabase.
        It handles column mapping automatically and converts appropriate data types.
      </p>
    </CardFooter>
  </Card>
);
};

export default GoogleSheetsScriptInfo;
