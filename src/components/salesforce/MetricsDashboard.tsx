
import React, { useState } from 'react';
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
import { MetricsPeriodSelector } from './MetricsPeriodSelector';
import { LeadsMetricsData, OpportunityMetricsData } from '@/hooks/salesforce/types';

interface MetricsDashboardProps {
  leadsMetrics: LeadsMetricsData;
  opportunityMetrics: OpportunityMetricsData;
  selectedCampusName: string | null;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({
  leadsMetrics,
  opportunityMetrics,
  selectedCampusName
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  
  return (
    <Card className="mt-8">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl font-medium">
            Performance Metrics {selectedCampusName ? `for ${selectedCampusName}` : '(All Campuses)'}
          </CardTitle>
          <MetricsPeriodSelector 
            selectedPeriod={selectedPeriod} 
            onSelectPeriod={setSelectedPeriod}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="leads" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="leads">Lead Growth</TabsTrigger>
            <TabsTrigger value="pipeline">Pipeline Conversion</TabsTrigger>
          </TabsList>
          
          <TabsContent value="leads" className="space-y-4">
            <MetricsTable 
              metrics={leadsMetrics.metrics}
              period={selectedPeriod}
            />
            <MetricsCharts 
              timeSeriesData={leadsMetrics.timeSeriesData}
              period={selectedPeriod}
            />
          </TabsContent>
          
          <TabsContent value="pipeline" className="space-y-4">
            <MetricsTable 
              metrics={opportunityMetrics.metrics}
              period={selectedPeriod}
            />
            <MetricsCharts 
              timeSeriesData={opportunityMetrics.timeSeriesData}
              period={selectedPeriod}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
