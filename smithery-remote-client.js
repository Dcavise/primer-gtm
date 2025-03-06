#!/usr/bin/env node

import { createTransport } from "@smithery/sdk/transport.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"

// Create a transport to connect to the remote Smithery server
const transport = createTransport("https://server.smithery.ai/@joshuarileydev/supabase-mcp-server", {
  config: {
    supabaseApiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZG5jaWx1cmVxcHp4cnhmdXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMjM1NTUsImV4cCI6MjA1NjY5OTU1NX0.0lZySUmlC3nQs-62Ka-0rE6d9on3KIAt6U16g4YYpxY"
  }
});

async function main() {
  try {
    // Create MCP client
    const client = new Client({
      name: "Supabase Test Client",
      version: "1.0.0"
    });
    
    console.log("Connecting to remote Smithery server...");
    
    // Add a timeout for the connection
    const connectPromise = client.connect(transport);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Connection timeout after 15 seconds")), 15000);
    });
    
    await Promise.race([connectPromise, timeoutPromise]);
    console.log("Connected successfully!");

    // Use the server tools with your LLM application
    console.log("Listing available tools...");
    const tools = await client.listTools();
    
    if (tools.length === 0) {
      console.log("No tools available from the server");
    } else {
      console.log("Available tools:");
      tools.forEach((tool, index) => {
        console.log(`${index + 1}. ${tool.name}: ${tool.description || 'No description'}`);
      });
      
      // Example: Call a specific tool if it exists
      const queryTool = tools.find(t => t.name === "query");
      if (queryTool) {
        console.log(`\nCalling the 'query' tool...`);
        try {
          const result = await client.callTool("query", {
            query: "SELECT * FROM users LIMIT 5"
          });
          console.log("Query result:", JSON.stringify(result, null, 2));
        } catch (error) {
          console.error("Error calling query tool:", error.message);
        }
      }
    }

    // Disconnect when done
    await client.disconnect();
    console.log("Disconnected from server");
  } catch (error) {
    console.error("Error:", error.message);
    
    if (error.message.includes("Connection timeout")) {
      console.log("\nTroubleshooting tips:");
      console.log("1. Check your internet connection");
      console.log("2. Verify the Supabase API key is correct");
      console.log("3. Make sure the Smithery server is available at the specified URL");
    }
  }
}

// Run the main function
main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
}); 