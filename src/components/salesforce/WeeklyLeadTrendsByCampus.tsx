import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WeeklyLeadCount } from "@/hooks/salesforce/types";
import { Campus } from "@/hooks/salesforce/types";

interface WeeklyLeadTrendsByCampusProps {
  weeklyLeadCounts: WeeklyLeadCount[];
  campuses: Campus[];
  selectedCampusName: string | null;
}

export const WeeklyLeadTrendsByCampus = ({ selectedCampusName }: WeeklyLeadTrendsByCampusProps) => {
  return (
    <Card className="mt-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl">
          Weekly Lead Trends {selectedCampusName ? `for ${selectedCampusName}` : "(All Campuses)"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center bg-gray-50 rounded-md">
          <p className="text-gray-500">
            Weekly lead trends temporarily disabled while backend calculations are being
            implemented.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
