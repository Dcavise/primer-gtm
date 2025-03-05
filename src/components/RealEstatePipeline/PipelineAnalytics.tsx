
import React from 'react';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PropertyStatusChart from './PropertyStatusChart';
import PropertyPhaseChart from './PropertyPhaseChart';
import PropertyMarketChart from './PropertyMarketChart';
import PropertyStateChart from './PropertyStateChart';

type RealEstateProperty = Tables<'real_estate_pipeline'>;

interface PipelineAnalyticsProps {
  pipelineAnalytics: RealEstateProperty[];
}

export const PipelineAnalytics: React.FC<PipelineAnalyticsProps> = ({ pipelineAnalytics }) => {
  if (!pipelineAnalytics || pipelineAnalytics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Analytics</CardTitle>
          <CardDescription>
            No data available. Please sync data to view analytics.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Property Status</CardTitle>
          <CardDescription>
            Distribution of properties by status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PropertyStatusChart properties={pipelineAnalytics} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Market Distribution</CardTitle>
          <CardDescription>
            Properties by market location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PropertyMarketChart properties={pipelineAnalytics} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>State Distribution</CardTitle>
          <CardDescription>
            Properties by state
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PropertyStateChart properties={pipelineAnalytics} />
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle>Pipeline Phases</CardTitle>
          <CardDescription>
            Properties by pipeline phase
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PropertyPhaseChart properties={pipelineAnalytics} />
        </CardContent>
      </Card>
    </div>
  );
};

export default PipelineAnalytics;
