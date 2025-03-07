#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key configured:', !!supabaseKey);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('Testing Supabase connection...');
  
  try {
    // Try to fetch a simple count from the campuses table
    const { data, error } = await supabase
      .from('campuses')
      .select('count')
      .limit(1);
    
    if (error) {
      console.error('Connection error:', error);
    } else {
      console.log('Connection successful!', data);
    }
    
    // Try to check auth status
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Auth error:', authError);
    } else {
      console.log('Auth status:', authData ? 'Session exists' : 'No session');
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

// Run the test
testConnection(); 