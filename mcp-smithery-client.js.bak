// This file requires Node.js with ESM support
// Run with: node mcp-smithery-client.js

import { createTransport } from "@smithery/sdk/transport.js"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"

async function main() {
	try {
		console.log("Creating transport to Smithery server...")
		const transportUrl = "https://server.smithery.ai/@Deploya-labs/mcp-supabase"
		console.log(`Using transport URL: ${transportUrl}`)
		
		const transport = createTransport(transportUrl, {
			// Add optional transport configuration if needed
			timeout: 30000, // 30 seconds timeout
		})

		// Create MCP client
		console.log("Creating MCP client...")
		const client = new Client({
			name: "Test client",
			version: "1.0.0",
			// Add any additional client options if needed
		})
		
		console.log("Connecting to transport...")
		await client.connect(transport)
		console.log("Connected successfully!")

		// Use the server tools with your LLM application
		console.log("Listing available tools...")
		const tools = await client.listTools()
		console.log(`Available tools (${tools.length}): ${tools.map(t => t.name).join(", ")}`)

		// Example: Call a tool
		// const result = await client.callTool("tool_name", { param1: "value1" })
		
		// Clean up
		console.log("Disconnecting...")
		await client.disconnect()
		console.log("Disconnected successfully")
	} catch (error) {
		console.error("Error occurred:", error.message)
		console.error("Error details:", error)
		
		if (error.message.includes("Connection closed")) {
			console.log("\nPossible solutions:")
			console.log("1. Check if the Smithery server URL is correct")
			console.log("2. Verify that the server is running and accessible")
			console.log("3. Check if you need authentication credentials")
			console.log("4. Check network connectivity and firewall settings")
		}
	}
}

main() 