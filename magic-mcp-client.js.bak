#!/usr/bin/env node

import { createTransport } from "@smithery/sdk/transport.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"

// Create a transport to connect to the Smithery Magic MCP server
const transport = createTransport("https://server.smithery.ai/@21st-dev/magic-mcp", {
  "31a9a25dd106139eb60666b3fb9bb0b2826506af506d6ab0a076418431eac05d": "The API key from https://21st.dev/magic/console"
})

async function main() {
  try {
    // Create MCP client
    const client = new Client({
      name: "Test client",
      version: "1.0.0"
    })
    
    console.log("Connecting to Magic MCP server...")
    await client.connect(transport)
    console.log("Connected successfully!")

    // Use the server tools with your LLM application
    console.log("Listing available tools...")
    const tools = await client.listTools()
    console.log(`Available tools: ${tools.map(t => t.name).join(", ")}`)

    // Example: Call a tool
    // Uncomment and modify to call specific tools
    // const result = await client.callTool("tool_name", { param1: "value1" })
    // console.log("Tool result:", result)

    // Disconnect when done
    await client.disconnect()
    console.log("Disconnected from server")
  } catch (error) {
    console.error("Error:", error.message)
  }
}

// Run the main function
main().catch(error => {
  console.error("Fatal error:", error)
  process.exit(1)
})
