
import React from 'react';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import PropertyStatusChart from './PropertyStatusChart';
import PropertyPhaseChart from './PropertyPhaseChart';
import PropertyMarketChart from './PropertyMarketChart';

type RealEstateProperty = Tables<'real_estate_pipeline'>;

interface PipelineAnalyticsProps {
  properties: RealEstateProperty[];
}

export const PipelineAnalytics: React.FC<PipelineAnalyticsProps> = ({ properties }) => {
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
          <PropertyStatusChart properties={properties} />
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
          <PropertyMarketChart properties={properties} />
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
          <PropertyPhaseChart properties={properties} />
        </CardContent>
      </Card>
    </div>
  );
};

export default PipelineAnalytics;
