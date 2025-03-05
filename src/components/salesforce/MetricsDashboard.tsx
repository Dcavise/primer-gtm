
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { MetricsTable } from './MetricsTable';
import { MetricsCharts } from './MetricsCharts';
import { LeadsMetricsData, OpportunityMetricsData, AttendanceMetricsData } from '@/hooks/salesforce/types';

interface MetricsDashboardProps {
  leadsMetrics: LeadsMetricsData;
  opportunityMetrics: OpportunityMetricsData;
  attendanceMetrics: AttendanceMetricsData;
  selectedCampusName: string | null;
  selectedCampusId: string | null;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  leadsMetrics,
  opportunityMetrics,
  attendanceMetrics,
  selectedCampusName,
  selectedCampusId
}) => {
  return (
    <Card className="mt-8">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-medium">
          Performance Metrics {selectedCampusName ? `for ${selectedCampusName}` : '(All Campuses)'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="leads" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="leads">Lead Growth</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline Conversion</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="leads" className="space-y-4">
            <MetricsTable 
              metrics={leadsMetrics.metrics}
              period="weekly"
            />
            <MetricsCharts 
              timeSeriesData={leadsMetrics.timeSeriesData}
              period="weekly"
            />
          </TabsContent>
          
          <TabsContent value="pipeline" className="space-y-4">
            <MetricsTable 
              metrics={opportunityMetrics.metrics}
              period="weekly"
            />
            <MetricsCharts 
              timeSeriesData={opportunityMetrics.timeSeriesData}
              period="weekly"
            />
          </TabsContent>
          
          <TabsContent value="attendance" className="space-y-4">
            <MetricsTable 
              metrics={attendanceMetrics.metrics}
              period="weekly"
            />
            <MetricsCharts 
              timeSeriesData={attendanceMetrics.timeSeriesData}
              period="weekly"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
