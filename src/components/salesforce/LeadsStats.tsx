import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Users, Activity, CheckCircle, BarChart } from 'lucide-react';

interface LeadsStatsProps {
  stats: {
    totalLeads: number;
    openLeads: number;
    convertedLeads: number;
    byCampus: { [key: string]: number };
    bySource: { [key: string]: number };
  };
  isLoading: boolean;
}

export const LeadsStats: React.FC<LeadsStatsProps> = ({ stats, isLoading }) => {
  const { totalLeads, openLeads, convertedLeads, byCampus, bySource } = stats;
  
  const getTopSources = () => {
    return Object.entries(bySource || {})
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg h-6 shimmer-bg"></CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold h-8 shimmer-bg"></div>
              <p className="text-xs text-muted-foreground mt-2 h-4 shimmer-bg"></p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Leads Card */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Total Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLeads || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              Overall leads in the system
            </p>
          </CardContent>
        </Card>
        
        {/* Open Leads Card */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Open Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openLeads || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {totalLeads ? Math.round((openLeads / totalLeads) * 100) : 0}% of total leads
            </p>
          </CardContent>
        </Card>
        
        {/* Converted Leads Card */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Converted Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{convertedLeads || 0}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {totalLeads ? Math.round((convertedLeads / totalLeads) * 100) : 0}% conversion rate
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Campus Distribution */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <User className="h-5 w-5 mr-2" />
              Leads by Campus
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(byCampus || {}).length > 0 ? (
              <div className="space-y-2">
                {Object.entries(byCampus).map(([campus, count]) => (
                  <div key={campus} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Badge variant="outline" className="mr-2">
                        {campus}
                      </Badge>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium">{count}</span>
                      <div className="ml-2 h-2 w-16 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary"
                          style={{ width: `${Math.min(100, (count / totalLeads) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No campus data available</p>
            )}
          </CardContent>
        </Card>
        
        {/* Source Distribution */}
        <Card className="col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <BarChart className="h-5 w-5 mr-2" />
              Top Lead Sources
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(bySource || {}).length > 0 ? (
              <div className="space-y-2">
                {getTopSources().map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Badge variant="secondary" className="mr-2">
                        {source}
                      </Badge>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium">{count}</span>
                      <div className="ml-2 h-2 w-16 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary"
                          style={{ width: `${Math.min(100, (count / totalLeads) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No source data available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 