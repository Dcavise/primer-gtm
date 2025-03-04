
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { permitData, zoningData, censusData, schoolsData, address } = await req.json();
    
    if (!openAIApiKey) {
      console.error("OpenAI API key not found");
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log(`Generating property summary for: ${address}`);
    console.log(`Data available: Permits: ${permitData?.length || 0}, Zoning: ${zoningData?.length || 0}, Schools: ${schoolsData?.length || 0}, Census: ${censusData ? 'Yes' : 'No'}`);
    
    // Prepare the data for OpenAI in a structured way
    const permitSummary = permitData && permitData.length > 0 
      ? `${permitData.length} permits found, including: ${permitData.slice(0, 3).map(p => p.project_type || p.project_name || "Unknown project").join(", ")}${permitData.length > 3 ? "..." : ""}`
      : "No permit data available";
    
    const zoningSummary = zoningData && zoningData.length > 0
      ? `Zoning: ${zoningData[0].zone_code} (${zoningData[0].zone_name}) - ${zoningData[0].zone_type}`
      : "No zoning data available";
    
    const censusSummary = censusData 
      ? `Demographics: Population ~${censusData.totalPopulation || "Unknown"}, Median household income: $${censusData.medianHouseholdIncome || "Unknown"}, Median home value: $${censusData.medianHomeValue || "Unknown"}`
      : "No census data available";
      
    const schoolsSummary = schoolsData && schoolsData.length > 0
      ? `${schoolsData.length} schools nearby, including: ${schoolsData.slice(0, 3).map(s => `${s.name} (${s.level}, Rating: ${s.rating || "N/A"}/10)`).join(", ")}${schoolsData.length > 3 ? "..." : ""}`
      : "No school data available";
      
    const prompt = `
You are a professional real estate data analyst. Generate a concise, informative summary of the property based on the following data:

PROPERTY ADDRESS: ${address}

PERMITS DATA: ${permitSummary}

ZONING INFORMATION: ${zoningSummary}

DEMOGRAPHIC DATA: ${censusSummary}

SCHOOLS: ${schoolsSummary}

Format your response as a real estate professional would, highlighting key insights about the property's development history, zoning restrictions, neighborhood demographics, and educational opportunities. Keep your summary under 400 words, focusing on the most relevant information for someone researching this property. Use bullet points where appropriate.
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful real estate data analyst that summarizes property information clearly and concisely.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API error:", errorData);
      return new Response(
        JSON.stringify({ error: 'Error generating summary', details: errorData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log("Summary generated successfully");
    
    return new Response(
      JSON.stringify({ 
        summary: data.choices[0].message.content,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-property-summary function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
