#!/usr/bin/env node

import fetch from 'node-fetch';

async function testSupabaseApi() {
  console.log('Testing Supabase API endpoint...');
  
  const supabaseUrl = 'https://pudncilureqpzxrxfupr.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1ZG5jaWx1cmVxcHp4cnhmdXByIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDExMjM1NTUsImV4cCI6MjA1NjY5OTU1NX0.0lZySUmlC3nQs-62Ka-0rE6d9on3KIAt6U16g4YYpxY';
  
  try {
    console.log(`Testing connection to ${supabaseUrl}/rest/v1/campuses?select=count...`);
    
    const response = await fetch(`${supabaseUrl}/rest/v1/campuses?select=count`, {
      method: 'GET',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      console.log('Connection successful!');
    } else {
      console.error('Error response:', await response.text());
    }
  } catch (error) {
    console.error('Error connecting to Supabase API:', error.message);
  }
}

testSupabaseApi(); 