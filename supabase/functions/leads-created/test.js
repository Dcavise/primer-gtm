// Test script for the leads-created Edge Function
// Run with: node supabase/functions/leads-created/test.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY env variables.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to simulate API call to the Edge Function
async function testLeadsCreatedFunction() {
  console.log('Testing leads-created Edge Function...');
  
  // Test case 1: Default parameters
  console.log('\nTest Case 1: Default parameters (weekly, 12 periods)');
  await testWithParams({});
  
  // Test case 2: Monthly data
  console.log('\nTest Case 2: Monthly data (6 months)');
  await testWithParams({
    period: 'month',
    lookback_units: 6
  });
  
  // Test case 3: Campus filter (if we have a campus ID)
  console.log('\nTest Case 3: Getting a campus ID for filtering...');
  
  try {
    // Get a sample campus ID
    const { data: campusData, error: campusError } = await supabase.rpc('execute_sql_query', {
      query_text: 'SELECT id, name FROM fivetran_views.campus_c LIMIT 1'
    });
    
    if (campusError) throw campusError;
    
    if (campusData && campusData.length > 0) {
      const sampleCampusId = campusData[0].id;
      const sampleCampusName = campusData[0].name;
      
      console.log(`Found campus: ${sampleCampusName} (ID: ${sampleCampusId})`);
      console.log('Testing campus filter...');
      
      await testWithParams({
        campus_id: sampleCampusId
      });
    } else {
      console.log('No campuses found to test with.');
    }
  } catch (error) {
    console.error('Error getting campus data:', error);
  }
  
  console.log('\nAll tests completed!');
}

// Helper function to test with specific parameters
async function testWithParams(params) {
  try {
    // Build query for our SQL function
    const period = params.period || 'week';
    const lookbackUnits = params.lookback_units || 12;
    const campusId = params.campus_id || null;
    
    let query = `SELECT * FROM fivetran_views.get_lead_metrics('${period}', ${lookbackUnits}`;
    if (campusId) {
      query += `, '${campusId}'`;
    } else {
      query += `, NULL`;
    }
    query += `)`;
    
    // Execute query
    const { data, error } = await supabase.rpc('execute_sql_query', {
      query_text: query
    });
    
    if (error) throw error;
    
    // Process the data like our Edge Function would
    const result = processLeadMetrics(data, period);
    
    // Output some info
    console.log(`Found ${result.periods.length} periods of data`);
    console.log(`Latest period: ${result.latestPeriod}, Total: ${result.latestTotal} leads`);
    
    if (result.periods.length > 1) {
      const latestPeriod = result.latestPeriod;
      const change = result.changes.raw[latestPeriod];
      const changePercent = result.changes.percentage[latestPeriod].toFixed(1);
      
      console.log(`Change from previous period: ${change > 0 ? '+' : ''}${change} leads (${changePercent}%)`);
    }
    
    console.log(`Top campuses (${Math.min(3, result.campuses.length)}):`);
    const topCampuses = [...result.campuses]
      .sort((a, b) => (result.campusTotals[b] || 0) - (result.campusTotals[a] || 0))
      .slice(0, 3);
      
    topCampuses.forEach(campus => {
      console.log(`- ${campus}: ${result.campusTotals[campus]} leads`);
    });
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Same processing function as in the Edge Function
function processLeadMetrics(rawData, period) {
  if (!rawData || !rawData.length) {
    return { 
      periods: [], 
      campuses: [], 
      totals: {}, 
      raw: [],
      latestPeriod: null,
      latestTotal: 0,
      getLeadCount: () => 0,
      periodType: period
    };
  }
  
  // Get unique periods, sorted by date
  const periods = [...new Set(rawData.map(item => item.period_start))]
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  // Get unique campuses
  const campuses = [...new Set(rawData.map(item => item.campus_name))]
    .filter(name => name !== 'No Campus Match'); // Optionally filter out "No Campus Match"
  
  // Calculate period totals
  const totals = periods.reduce((acc, period) => {
    const periodData = rawData.filter(item => item.period_start === period);
    acc[period] = periodData.reduce((sum, item) => sum + Number(item.lead_count), 0);
    return acc;
  }, {});
  
  // Calculate campus totals across all periods
  const campusTotals = campuses.reduce((acc, campus) => {
    const campusData = rawData.filter(item => item.campus_name === campus);
    acc[campus] = campusData.reduce((sum, item) => sum + Number(item.lead_count), 0);
    return acc;
  }, {});
  
  // Calculate week-over-week or period-over-period changes
  const changes = periods.length > 1 ? 
    calculatePeriodChanges(periods, totals) : 
    { raw: {}, percentage: {} };
  
  // Format data for time series chart
  const timeSeriesData = periods.map(period => ({
    period,
    total: totals[period],
    campuses: campuses.reduce((acc, campus) => {
      const match = rawData.find(item => 
        item.period_start === period && 
        item.campus_name === campus
      );
      acc[campus] = match ? Number(match.lead_count) : 0;
      return acc;
    }, {})
  })).reverse(); // Reverse to get chronological order
  
  // Return structured data
  return {
    // Raw data for detailed analysis
    raw: rawData,
    
    // Aggregated data
    periods,
    campuses,
    totals,
    campusTotals,
    
    // Latest period information
    latestPeriod: periods[0] || null,
    latestTotal: periods[0] ? totals[periods[0]] : 0,
    
    // Changes
    changes,
    
    // Time series data for charts
    timeSeriesData,
    
    // Helper function
    getLeadCount: (periodStart, campusName) => {
      const match = rawData.find(item => 
        item.period_start === periodStart && 
        item.campus_name === campusName
      );
      return match ? Number(match.lead_count) : 0;
    },
    
    // Period type used for this data
    periodType: period
  };
}

// Helper to calculate period-over-period changes
function calculatePeriodChanges(periods, totals) {
  const raw = {};
  const percentage = {};
  
  for (let i = 0; i < periods.length - 1; i++) {
    const currentPeriod = periods[i];
    const previousPeriod = periods[i + 1];
    
    const currentValue = totals[currentPeriod];
    const previousValue = totals[previousPeriod];
    
    raw[currentPeriod] = currentValue - previousValue;
    
    if (previousValue !== 0) {
      percentage[currentPeriod] = ((currentValue - previousValue) / previousValue) * 100;
    } else {
      percentage[currentPeriod] = currentValue > 0 ? 100 : 0;
    }
  }
  
  return { raw, percentage };
}

// Run the tests
testLeadsCreatedFunction();