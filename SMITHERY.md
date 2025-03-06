# Smithery Configuration

This repository includes configuration for deploying to Smithery.ai as an MCP (Machine Conversation Protocol) server.

## Configuration Files

The following files are used for Smithery deployment:

- `Dockerfile.smithery` - Defines how to build the MCP server
- `smithery.yaml` - Defines how to start the MCP server and its configuration options
- `server.js` - The STDIO-based MCP server implementation

## Configuration Options

The MCP server supports the following configuration options:

- `logLevel` - The logging level (error, warn, info, debug)
- `timeout` - Timeout in milliseconds for requests (1000-60000)

## Local Testing

To test the MCP server locally:

1. Build the Docker image:
   ```
   docker build -f Dockerfile.smithery -t mcp-server .
   ```

2. Run the Docker container:
   ```
   docker run -it --rm -e LOG_LEVEL=debug mcp-server
   ```

3. You can then interact with the server by sending JSON messages to stdin and receiving responses from stdout.

## Deployment

When deploying to Smithery:

1. Ensure both `Dockerfile.smithery` and `smithery.yaml` are in your repository
2. In your Smithery server settings, set the Dockerfile path to `Dockerfile.smithery`
3. Configure your server options using the schema defined in `smithery.yaml`

## Protocol

The MCP server implements a simple request-response protocol over STDIO:

- Requests are JSON objects with `type`, `id`, `method`, and `params` fields
- Responses are JSON objects with `type`, `id`, `result`, and `error` fields
- The server supports the following methods:
  - `ping` - A simple ping method that returns a pong response
  - `execute` - Executes a command and returns the result

Example request:
```json
{"type":"request","id":"req_1","method":"ping","params":{}}
```

Example response:
```json
{"type":"response","id":"req_1","result":{"status":"ok","message":"pong"},"error":null}
``` 