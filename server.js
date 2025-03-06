#!/usr/bin/env node

/**
 * MCP Server for Smithery
 * This server handles STDIO communication for the MCP protocol
 */

const readline = require('readline');

// Get configuration from environment variables
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT || '30000', 10);

// Set up logging based on log level
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLogLevel = logLevels[LOG_LEVEL] || logLevels.info;

function log(level, message) {
  if (logLevels[level] <= currentLogLevel) {
    console.error(`[${level.toUpperCase()}] ${message}`);
  }
}

// Create interface for reading from stdin and writing to stdout
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});

// Initialize state
let requestId = 0;
const pendingRequests = new Map();

// Process incoming messages
rl.on('line', async (line) => {
  try {
    const message = JSON.parse(line);
    
    log('debug', `Received message: ${line}`);
    
    if (message.type === 'request') {
      handleRequest(message);
    } else if (message.type === 'response') {
      handleResponse(message);
    } else {
      log('warn', `Unknown message type: ${message.type}`);
    }
  } catch (error) {
    log('error', `Error processing message: ${error.message}`);
  }
});

// Handle incoming requests
async function handleRequest(request) {
  const { id, method, params } = request;
  
  log('info', `Handling request ${id}: ${method}`);
  log('debug', `Request params: ${JSON.stringify(params)}`);
  
  try {
    let result;
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timed out')), REQUEST_TIMEOUT);
    });
    
    // Handle different method types
    const methodPromise = (async () => {
      switch (method) {
        case 'ping':
          return { status: 'ok', message: 'pong' };
          
        case 'execute':
          // Process the execution request
          return await processExecution(params);
          
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
    })();
    
    // Race the method execution against the timeout
    result = await Promise.race([methodPromise, timeoutPromise]);
    
    // Send response
    sendResponse(id, result, null);
  } catch (error) {
    log('error', `Error handling request ${id}: ${error.message}`);
    sendResponse(id, null, { message: error.message });
  }
}

// Process execution requests
async function processExecution(params) {
  log('info', 'Processing execution request');
  
  // This is where you would implement your specific MCP functionality
  // For now, we'll just echo back the params
  return {
    result: `Processed request with params: ${JSON.stringify(params)}`,
    timestamp: new Date().toISOString()
  };
}

// Handle responses to our requests
function handleResponse(response) {
  const { id, result, error } = response;
  
  log('debug', `Received response for request ${id}`);
  
  if (pendingRequests.has(id)) {
    const { resolve, reject } = pendingRequests.get(id);
    
    if (error) {
      log('warn', `Request ${id} failed: ${JSON.stringify(error)}`);
      reject(error);
    } else {
      log('debug', `Request ${id} succeeded`);
      resolve(result);
    }
    
    pendingRequests.delete(id);
  } else {
    log('warn', `Received response for unknown request: ${id}`);
  }
}

// Send a response back through stdout
function sendResponse(id, result, error) {
  const response = {
    type: 'response',
    id,
    result,
    error
  };
  
  log('debug', `Sending response for request ${id}: ${JSON.stringify(response)}`);
  process.stdout.write(JSON.stringify(response) + '\n');
}

// Send a request and return a promise for the response
function sendRequest(method, params) {
  return new Promise((resolve, reject) => {
    const id = `req_${requestId++}`;
    
    log('info', `Sending request ${id}: ${method}`);
    log('debug', `Request params: ${JSON.stringify(params)}`);
    
    pendingRequests.set(id, { resolve, reject });
    
    const request = {
      type: 'request',
      id,
      method,
      params
    };
    
    process.stdout.write(JSON.stringify(request) + '\n');
    
    // Set up request timeout
    setTimeout(() => {
      if (pendingRequests.has(id)) {
        log('warn', `Request ${id} timed out`);
        pendingRequests.delete(id);
        reject(new Error('Request timed out'));
      }
    }, REQUEST_TIMEOUT);
  });
}

// Handle process termination
process.on('SIGINT', () => {
  log('info', 'Received SIGINT, shutting down');
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('info', 'Received SIGTERM, shutting down');
  process.exit(0);
});

// Log startup
log('info', 'MCP server started and ready to process requests');
log('debug', `Configuration: LOG_LEVEL=${LOG_LEVEL}, REQUEST_TIMEOUT=${REQUEST_TIMEOUT}ms`); 