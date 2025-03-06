#!/usr/bin/env node

import { createTransport } from "@smithery/sdk/transport.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"

// Create a transport to connect to the Smithery server
// Using localhost since we're running the server locally with npx
const transport = createTransport("http://localhost:3000", {
  config: {
    supabaseApiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZG5jaWx1cmVxcHp4cnhmdXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMjM1NTUsImV4cCI6MjA1NjY5OTU1NX0.0lZySUmlC3nQs-62Ka-0rE6d9on3KIAt6U16g4YYpxY"
  }
});

async function main() {
  try {
    // Create MCP client
    const client = new Client({
      name: "Test client",
      version: "1.0.0"
    });
    
    console.log("Connecting to Smithery server...");
    
    // Add a timeout for the connection
    const connectPromise = client.connect(transport);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Connection timeout after 10 seconds")), 10000);
    });
    
    await Promise.race([connectPromise, timeoutPromise]);
    console.log("Connected successfully!");

    // Use the server tools with your LLM application
    console.log("Listing available tools...");
    const tools = await client.listTools();
    console.log(`Available tools: ${tools.map(t => t.name).join(", ")}`);

    // Example: Call the first available tool if any exist
    if (tools.length > 0) {
      const firstTool = tools[0];
      console.log(`Calling tool: ${firstTool.name}`);
      try {
        const result = await client.callTool(firstTool.name, {});
        console.log(`Result from ${firstTool.name}:`, result);
      } catch (error) {
        console.error(`Error calling tool ${firstTool.name}:`, error.message);
      }
    } else {
      console.log("No tools available to call");
    }

    // Disconnect when done
    await client.disconnect();
    console.log("Disconnected from server");
  } catch (error) {
    console.error("Error:", error.message);
    if (error.message.includes("Connection timeout")) {
      console.log("\nTroubleshooting tips:");
      console.log("1. Make sure the Smithery server is running in another terminal");
      console.log("2. Check if the server is running on the correct port (default is 3000)");
      console.log("3. Try using the remote URL if the local server isn't working:");
      console.log("   - Change the transport URL to: https://server.smithery.ai/@joshuarileydev/supabase-mcp-server");
    }
  }
}

// Run the main function
main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
}); 