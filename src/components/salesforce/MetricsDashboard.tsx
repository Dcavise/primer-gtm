import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LeadsMetricsData,
  OpportunityMetricsData,
  AttendanceMetricsData,
} from "@/hooks/salesforce/types";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { supabase } from "@/integrations/supabase-client";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { TrendIndicator } from "./TrendIndicator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MetricsDashboardProps {
  leadsMetrics: LeadsMetricsData;
  opportunityMetrics: OpportunityMetricsData;
  attendanceMetrics: AttendanceMetricsData;
  selectedCampusNames: string[];
  selectedCampusIds: string[];
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  opportunityMetrics,
  selectedCampusNames,
  selectedCampusIds,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weekOverWeekData, setWeekOverWeekData] = useState<any[]>([]);
  const [closedWonData, setClosedWonData] = useState<any[]>([]);
  const [validCampusIds, setValidCampusIds] = useState<string[]>([]);

  // Chart colors based on the design system
  const chartColors = {
    leads: "#1F77B4",
    newOpportunities: "#FF7F0E",
    closedWon: "#2CA02C",
    closedLost: "#D62728",
    winRate: "#9467BD",
    daysToClose: "#8C564B",
  };

  // Fetch valid campus IDs from the public.campuses table
  useEffect(() => {
    const fetchValidCampusIds = async () => {
      try {
        const { data, error } = await supabase
          .from("campuses")
          .select("campus_id");

        if (error) throw error;

        const ids = data.map((campus) => campus.campus_id);
        setValidCampusIds(ids);
        console.log("Valid campus IDs for metrics dashboard:", ids);
      } catch (err) {
        console.error("Error fetching valid campus IDs:", err);
      }
    };

    fetchValidCampusIds();
  }, []);

  useEffect(() => {
    const fetchMetricsData = async () => {
      if (validCampusIds.length === 0) return; // Don't fetch until we have valid IDs

      setIsLoading(true);
      setError(null);

      try {
        // Fetch week-over-week comparison data
        const { data: wowData, error: wowError } = await supabase.rpc(
          "get_week_over_week_comparison",
          {
            p_campus_id:
              selectedCampusIds.length === 1 ? selectedCampusIds[0] : null,
          },
        );

        if (wowError) throw wowError;

        // Fetch closed won by campus data
        const { data: closedWonByData, error: closedWonError } =
          await supabase.rpc("get_closed_won_by_campus");

        if (closedWonError) throw closedWonError;

        // Filter closed won data by valid campus IDs and campus selection
        let filteredClosedWonData = closedWonByData.filter(
          (item: any) =>
            validCampusIds.includes(item.campus_id) &&
            (selectedCampusIds.length === 0 ||
              selectedCampusIds.includes(item.campus_id)),
        );

        // Sort by win rate and limit to top 5
        filteredClosedWonData = filteredClosedWonData
          .sort((a: any, b: any) => b.win_rate - a.win_rate)
          .slice(0, 5);

        setWeekOverWeekData(wowData);
        setClosedWonData(filteredClosedWonData);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching metrics data:", err);
        setError("Failed to load metrics data. Please try again later.");
        setIsLoading(false);
      }
    };

    fetchMetricsData();
  }, [selectedCampusIds, selectedCampusNames, validCampusIds]);

  if (error) {
    return (
      <Card className="mt-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-medium">
            Performance Metrics{" "}
            {selectedCampusNames.length > 0
              ? selectedCampusNames.length === 1
                ? `for ${selectedCampusNames[0]}`
                : `for Selected Campuses (${selectedCampusNames.length})`
              : "(All Campuses)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium">
          Performance Metrics{" "}
          {selectedCampusNames.length > 0
            ? selectedCampusNames.length === 1
              ? `for ${selectedCampusNames[0]}`
              : `for Selected Campuses (${selectedCampusNames.length})`
            : "(All Campuses)"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && opportunityMetrics.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[120px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : (
          <Tabs defaultValue="weekly">
            <TabsList className="mb-4">
              <TabsTrigger value="weekly">Weekly Overview</TabsTrigger>
              <TabsTrigger value="opportunities">
                Opportunity Trends
              </TabsTrigger>
              <TabsTrigger value="sales-cycle">Sales Cycle</TabsTrigger>
              <TabsTrigger value="conversion">Lead Conversion</TabsTrigger>
            </TabsList>

            <TabsContent value="weekly">
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-3">
                  Week-over-Week Comparison
                </h3>
                {weekOverWeekData.length === 0 ? (
                  <div className="text-center text-gray-500 p-4">
                    No weekly comparison data available
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {weekOverWeekData.map((metric, index) => (
                      <div
                        key={index}
                        className="bg-white p-4 rounded-lg border shadow-sm"
                      >
                        <h4 className="text-sm font-medium text-gray-600">
                          {metric.metric}
                        </h4>
                        <div className="mt-2 flex items-baseline justify-between">
                          <div>
                            <span className="text-2xl font-semibold">
                              {metric.current_week}
                            </span>
                            <span className="ml-2 text-sm text-gray-500">
                              Current Week
                            </span>
                          </div>
                          <div className="flex items-center">
                            <TrendIndicator
                              value={metric.change_percentage}
                              format="percent"
                              showValue={true}
                              hideIcon={false}
                            />
                          </div>
                        </div>
                        <div className="mt-1 text-sm text-gray-500">
                          Previous: {metric.previous_week || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-medium mb-3">Win Rate by Campus</h3>
                {closedWonData.length === 0 ? (
                  <div className="text-center text-gray-500 p-4">
                    No win rate data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={closedWonData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="campus_name" />
                      <YAxis
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip
                        formatter={(value: number) => [`${value}%`, "Win Rate"]}
                        labelFormatter={(label) => `Campus: ${label}`}
                      />
                      <Bar
                        dataKey="win_rate"
                        fill={chartColors.closedWon}
                        name="Win Rate"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </TabsContent>

            <TabsContent value="opportunities">
              {opportunityMetrics.monthlyTrends.length === 0 ? (
                <div className="text-center text-gray-500 p-4">
                  Loading opportunity trends...
                </div>
              ) : (
                <div className="mt-4">
                  <h3 className="text-lg font-medium mb-3">
                    Monthly Opportunity Trends
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={opportunityMetrics.monthlyTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="new_opportunities"
                        name="New Opportunities"
                        stroke={chartColors.newOpportunities}
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="closed_won"
                        name="Closed Won"
                        stroke={chartColors.closedWon}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="closed_lost"
                        name="Closed Lost"
                        stroke={chartColors.closedLost}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="win_rate"
                        name="Win Rate (%)"
                        stroke={chartColors.winRate}
                        strokeDasharray="3 3"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {opportunityMetrics.stageProgression.length === 0 ? (
                <div className="text-center text-gray-500 p-4">
                  Loading stage progression data...
                </div>
              ) : (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">
                    Stage Progression Analysis
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full bg-white border rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stage
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Count
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Conversion %
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Avg Days
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Win Rate %
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {opportunityMetrics.stageProgression.map(
                          (stage, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {stage.stage_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {stage.opportunity_count}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {stage.conversion_to_next_stage}%
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {stage.avg_days_in_stage}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {stage.win_rate_from_stage}%
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="sales-cycle">
              {opportunityMetrics.salesCycles.length === 0 ? (
                <div className="text-center text-gray-500 p-4">
                  Loading sales cycle data...
                </div>
              ) : (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">
                    Sales Cycle by Campus
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={opportunityMetrics.salesCycles}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        type="number"
                        label={{
                          value: "Days",
                          position: "insideBottom",
                          offset: -5,
                        }}
                      />
                      <YAxis
                        type="category"
                        dataKey="campus_name"
                        width={120}
                      />
                      <Tooltip
                        formatter={(value: number) => [`${value} days`, ""]}
                      />
                      <Legend />
                      <Bar
                        dataKey="avg_days_to_win"
                        name="Days to Win"
                        fill={chartColors.closedWon}
                      />
                      <Bar
                        dataKey="avg_days_to_lose"
                        name="Days to Lose"
                        fill={chartColors.closedLost}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </TabsContent>

            <TabsContent value="conversion">
              {opportunityMetrics.leadToWinConversion.length === 0 ? (
                <div className="text-center text-gray-500 p-4">
                  Loading lead conversion data...
                </div>
              ) : (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">
                    Lead to Win Conversion
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={opportunityMetrics.leadToWinConversion}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis yAxisId="left" />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="new_leads"
                        name="New Leads"
                        stroke={chartColors.leads}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="new_opportunities"
                        name="New Opportunities"
                        stroke={chartColors.newOpportunities}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="lead_to_opp_rate"
                        name="Lead→Opp (%)"
                        stroke={chartColors.winRate}
                        strokeDasharray="3 3"
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="opp_to_win_rate"
                        name="Opp→Win (%)"
                        stroke={chartColors.closedWon}
                        strokeDasharray="3 3"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};
