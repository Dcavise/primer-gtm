#!/usr/bin/env node

import fetch from 'node-fetch';

async function testNetworkConnectivity() {
  console.log('Testing network connectivity...');
  
  const endpoints = [
    'https://pudncilureqpzxrxfupr.supabase.co',
    'https://api.github.com',
    'https://www.google.com',
    'https://jsonplaceholder.typicode.com/todos/1'
  ];
  
  for (const url of endpoints) {
    try {
      console.log(`Testing connection to ${url}...`);
      const response = await fetch(url);
      console.log(`Status: ${response.status} ${response.statusText}`);
      console.log(`Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
      console.log('Connection successful!');
    } catch (error) {
      console.error(`Error connecting to ${url}:`, error.message);
    }
    console.log('---');
  }
}

testNetworkConnectivity(); 