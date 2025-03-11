import React, { useMemo, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Campus } from "@/hooks/salesforce/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useDashboardCharts } from "@/hooks/salesforce/useDashboardCharts";
import { chartColors } from "@/utils/chartColors";

interface StatsCardGridProps {
  selectedCampusIds: string[];
  selectedCampusNames: string[];
  campuses?: Campus[];
}

export const StatsCardGrid: React.FC<StatsCardGridProps> = memo(
  ({ selectedCampusIds, selectedCampusNames }) => {
    // Use the custom hook for data fetching
    const { weeklyLeadData, opportunityData, isLoading, error } = useDashboardCharts(
      selectedCampusIds,
      selectedCampusNames
    );

    // Memoized chart colors to prevent re-creation
    const colors = useMemo(
      () => ({
        leads: chartColors.slice(0, 4),
        opportunities: chartColors.slice(0, 5),
      }),
      []
    );

    // Memoized chart rendering functions
    const renderWeeklyLeadChart = useMemo(() => {
      if (weeklyLeadData.length === 0) {
        return (
          <div className="text-center text-gray-500 p-4">
            No lead data available for the selected period
          </div>
        );
      }

      return (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={weeklyLeadData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis />
            <Tooltip
              formatter={(value: number) => [`${value} leads`, "Count"]}
              labelFormatter={(label) => `Week of ${label}`}
            />
            <Bar dataKey="count" fill="#1F77B4" name="Leads">
              {weeklyLeadData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors.leads[index % colors.leads.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }, [weeklyLeadData, colors.leads]);

    const renderOpportunityChart = useMemo(() => {
      if (opportunityData.length === 0) {
        return <div className="text-center text-gray-500 p-4">No opportunity data available</div>;
      }

      return (
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={opportunityData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis type="category" dataKey="stage_name" width={120} />
            <Tooltip formatter={(value: number) => [`${value} opportunities`, "Count"]} />
            <Bar dataKey="count" fill="#1F77B4" name="Opportunities">
              {opportunityData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={colors.opportunities[index % colors.opportunities.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      );
    }, [opportunityData, colors.opportunities]);

    if (error) {
      return (
        <Card className="mb-8">
          <CardContent className="p-6 mt-2">
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
      <Card className="mb-8">
        <CardContent className="p-6 mt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <h3 className="text-lg font-medium mb-4">Weekly Lead Trends</h3>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-[250px] w-full" />
                </div>
              ) : (
                renderWeeklyLeadChart
              )}
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-100">
              <h3 className="text-lg font-medium mb-4">Opportunities by Stage</h3>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-[250px] w-full" />
                </div>
              ) : (
                renderOpportunityChart
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
);
