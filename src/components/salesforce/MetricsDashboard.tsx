
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { LeadsMetricsData, OpportunityMetricsData, AttendanceMetricsData } from '@/hooks/salesforce/types';

interface MetricsDashboardProps {
  leadsMetrics: LeadsMetricsData;
  opportunityMetrics: OpportunityMetricsData;
  attendanceMetrics: AttendanceMetricsData;
  selectedCampusName: string | null;
  selectedCampusId: string | null;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  selectedCampusName
}) => {
  return (
    <Card className="mt-8">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium">
          Performance Metrics {selectedCampusName ? `for ${selectedCampusName}` : '(All Campuses)'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="p-6 text-center bg-gray-50 rounded-md">
          <p className="text-gray-500">
            Metrics dashboard temporarily disabled while backend calculations are being implemented.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
