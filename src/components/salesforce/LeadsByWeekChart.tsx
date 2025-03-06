import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface LeadData {
  week_start: string;
  campus_name: string;
  campus_id: string | null;
  lead_count: number;
  error?: string;
}

interface SimpleLeadData {
  week_start: string;
  lead_count: number;
  error?: string;
  available_columns?: string[];
}

interface ChartData {
  name: string; // week date
  [key: string]: string | number; // campus names as dynamic keys with lead counts
  total: number;
}

const LeadsByWeekChart = () => {
  const [data, setData] = useState<LeadData[] | SimpleLeadData[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lookbackWeeks, setLookbackWeeks] = useState(12);
  const [campusColors, setCampusColors] = useState<Record<string, string>>({});
  const [usingSimpleFunction, setUsingSimpleFunction] = useState(false);
  const [functionError, setFunctionError] = useState<Record<string, any> | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  const colorPalette = [
    "#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", 
    "#00C49F", "#FFBB28", "#FF8042", "#a4de6c", "#d0ed57"
  ];

  useEffect(() => {
    fetchData();
  }, [lookbackWeeks]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setFunctionError(null);
      setDebugInfo(null);
      setUsingSimpleFunction(false);

      console.log("Fetching lead data with lookback of", lookbackWeeks, "weeks");
      
      // Try the main function first
      const { data: leadData, error: fetchError } = await supabase.rpc(
        "get_fallback_lead_count_by_week_campus",
        { weeks_back: lookbackWeeks }
      );

      if (fetchError) {
        console.error("Main function error:", fetchError);
        
        // If the main function fails, try the simple function
        console.log("Trying simple lead count function...");
        const { data: simpleData, error: simpleError } = await supabase.rpc(
          "get_simple_lead_count_by_week",
          { lookback_weeks: lookbackWeeks }
        );

        if (simpleError) {
          console.error("Simple function error:", simpleError);
          throw new Error(`Both functions failed. Main error: ${fetchError.message}, Simple error: ${simpleError.message}`);
        }

        // Check if any data points contain error messages
        const errorData = simpleData?.find(item => item.error);
        if (errorData) {
          setFunctionError(errorData);
          setDebugInfo(JSON.stringify(errorData, null, 2));
          throw new Error(`Function returned error: ${errorData.error}`);
        }

        // Process simple data
        setUsingSimpleFunction(true);
        setData(simpleData || []);
        processSimpleDataForChart(simpleData || []);
      } else {
        // Check if any data points contain error messages
        const errorData = leadData?.find(item => item.error);
        if (errorData) {
          setFunctionError(errorData);
          setDebugInfo(JSON.stringify(errorData, null, 2));
          
          // Try simple function as fallback
          console.log("Main function returned error, trying simple function...");
          const { data: simpleData, error: simpleError } = await supabase.rpc(
            "get_simple_lead_count_by_week",
            { lookback_weeks: lookbackWeeks }
          );

          if (simpleError || !simpleData) {
            throw new Error(`Function returned error: ${errorData.error}`);
          }

          setUsingSimpleFunction(true);
          setData(simpleData);
          processSimpleDataForChart(simpleData);
        } else {
          // Process normal data
          setData(leadData || []);
          processDataForChart(leadData || []);
        }
      }
    } catch (err) {
      console.error("Error fetching lead data:", err);
      setError(err instanceof Error ? err.message : "Failed to load lead data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const processDataForChart = (leadData: LeadData[]) => {
    // Extract all unique campus names
    const campusNames = Array.from(
      new Set(leadData.map((item) => item.campus_name))
    );

    // Assign colors to campuses
    const colors: Record<string, string> = {};
    campusNames.forEach((campus, index) => {
      colors[campus] = colorPalette[index % colorPalette.length];
    });
    setCampusColors(colors);

    // Extract all unique weeks
    const weeks = Array.from(
      new Set(leadData.map((item) => item.week_start))
    ).sort();

    // Create chart data with proper structure for stacked bar chart
    const formattedData = weeks.map((week) => {
      const weekItems = leadData.filter((item) => item.week_start === week);
      
      // Start with a base object with the week
      const weekData: ChartData = {
        name: new Date(week).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        total: 0
      };
      
      // Add each campus's lead count
      weekItems.forEach((item) => {
        weekData[item.campus_name] = item.lead_count;
        weekData.total += item.lead_count;
      });
      
      return weekData;
    });

    setChartData(formattedData);
  };

  const processSimpleDataForChart = (simpleData: SimpleLeadData[]) => {
    // Create chart data for line chart
    const formattedData = simpleData.map((item) => ({
      name: new Date(item.week_start).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      total: item.lead_count,
      Leads: item.lead_count
    }));

    setChartData(formattedData);
  };

  const handleLookbackChange = (weeks: number) => {
    setLookbackWeeks(weeks);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Leads by Week and Campus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-[300px] w-full" />
            <div className="flex justify-center space-x-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Leads by Week{usingSimpleFunction ? "" : " and Campus"}</CardTitle>
        {usingSimpleFunction && (
          <CardDescription>
            Using simplified data view due to schema compatibility
          </CardDescription>
        )}
        <div className="flex space-x-2">
          <Button
            variant={lookbackWeeks === 4 ? "default" : "outline"}
            onClick={() => handleLookbackChange(4)}
          >
            4 Weeks
          </Button>
          <Button
            variant={lookbackWeeks === 12 ? "default" : "outline"}
            onClick={() => handleLookbackChange(12)}
          >
            12 Weeks
          </Button>
          <Button
            variant={lookbackWeeks === 26 ? "default" : "outline"}
            onClick={() => handleLookbackChange(26)}
          >
            26 Weeks
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="whitespace-pre-wrap">{error}</AlertDescription>
            <Button 
              onClick={() => fetchData()} 
              variant="outline" 
              className="mt-2"
            >
              Retry
            </Button>
            {debugInfo && (
              <div className="mt-4 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                <pre>{debugInfo}</pre>
              </div>
            )}
          </Alert>
        ) : chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            {usingSimpleFunction ? (
              <LineChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${value} leads`, "Count"]}
                  labelFormatter={(label) => `Week of ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Leads" 
                  stroke="#8884d8" 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            ) : (
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value, name) => [`${value} leads`, name]}
                  labelFormatter={(label) => `Week of ${label}`}
                />
                <Legend />
                {Object.keys(campusColors).map((campus) => (
                  <Bar
                    key={campus}
                    dataKey={campus}
                    stackId="a"
                    fill={campusColors[campus]}
                    name={campus}
                  />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        ) : (
          <div className="flex justify-center items-center h-[400px]">
            <p className="text-muted-foreground">No lead data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LeadsByWeekChart; 