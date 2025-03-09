import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

interface RequestParams {
  period?: 'day' | 'week' | 'month';
  lookback_units?: number;
  campus_id?: string | null;
}

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    // Create Supabase client using auth from request
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )
    
    // Get parameters from request
    const { period = 'week', lookback_units = 12, campus_id = null } = 
      (await req.json()) as RequestParams;
    
    // Build the query
    let query = `SELECT * FROM fivetran_views.get_lead_metrics('${period}', ${lookback_units}`;
    if (campus_id) {
      // Campus IDs are alphanumeric strings from Salesforce, pass as quoted string
      query += `, '${campus_id}'`;
    } else {
      query += `, NULL`;
    }
    query += `)`;
    
    // Execute the query
    const { data, error } = await supabaseClient.rpc('execute_sql_query', {
      query_text: query
    });
    
    if (error) throw error;
    
    // Process the data
    // Group results by period for easier consumption on the frontend
    const processingResult = processLeadMetrics(data, period);
    
    return new Response(
      JSON.stringify({
        success: true,
        data: processingResult,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    )
  }
})

// Helper function to process the raw metrics data
function processLeadMetrics(rawData: any[], period: string) {
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
    acc[period] = periodData.reduce((sum, item) => sum + item.lead_count, 0);
    return acc;
  }, {} as Record<string, number>);
  
  // Calculate campus totals across all periods
  const campusTotals = campuses.reduce((acc, campus) => {
    const campusData = rawData.filter(item => item.campus_name === campus);
    acc[campus] = campusData.reduce((sum, item) => sum + item.lead_count, 0);
    return acc;
  }, {} as Record<string, number>);
  
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
      acc[campus] = match ? match.lead_count : 0;
      return acc;
    }, {} as Record<string, number>)
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
    getLeadCount: (periodStart: string, campusName: string) => {
      const match = rawData.find(item => 
        item.period_start === periodStart && 
        item.campus_name === campusName
      );
      return match ? match.lead_count : 0;
    },
    
    // Period type used for this data
    periodType: period
  };
}

// Helper to calculate period-over-period changes
function calculatePeriodChanges(periods: string[], totals: Record<string, number>) {
  const raw: Record<string, number> = {};
  const percentage: Record<string, number> = {};
  
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