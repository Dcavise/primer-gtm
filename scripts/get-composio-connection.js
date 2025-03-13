import { Composio } from "composio-core";
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// ES module path resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from parent directory first, then script-specific ones
const parentEnvPath = path.resolve(process.cwd(), '.env');
const localEnvPath = path.resolve(__dirname, '.env');

if (fs.existsSync(parentEnvPath)) {
  dotenv.config({ path: parentEnvPath });
}
if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
}

async function getComposioConnection() {
  console.log("Getting Composio Connected Account...");
  
  // Get Composio client using API key from env or fallback to provided key
  const apiKey = process.env.COMPOSIO_API_KEY || "e73t7ope78jraacknx7m2h";
  const composio = new Composio({ apiKey });
  
  try {
    // Get the specific connected account
    const connection = await composio.connectedAccounts.get({
      connectedAccountId: "2d9cccd5-7906-4ba2-9777-62ab0da1fda4"
    });
    
    console.log("\n=== Composio Connected Account Details ===");
    if (connection) {
      console.log(`ID: ${connection.id}`);
      console.log(`Name: ${connection.name || 'Unnamed'}`);
      console.log(`Type: ${connection.type || 'Unknown'}`);
      console.log(`Connected: ${connection.connected ? 'Yes' : 'No'}`);
      console.log(`Created: ${new Date(connection.createdAt).toLocaleString()}`);
      
      // Show service-specific details if available
      if (connection.supabase) {
        console.log("\nSupabase Details:");
        console.log(`URL: ${connection.supabase.url}`);
        console.log(`Project ID: ${connection.supabase.projectId || 'Unknown'}`);
      }
      
      // Show full connection details for debugging
      console.log("\nFull Connection Details:");
      console.log(JSON.stringify(connection, null, 2));
    } else {
      console.log("Connection not found.");
    }
  } catch (error) {
    console.error("Error getting Composio connection:", error);
  }
}

// Execute the function
getComposioConnection().catch(console.error);
