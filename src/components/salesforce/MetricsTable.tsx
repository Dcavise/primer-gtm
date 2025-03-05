
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { MetricData } from '@/hooks/salesforce/types';
import { formatNumber, formatPercent } from '@/utils/format';
import { TrendIndicator } from './TrendIndicator';

interface MetricsTableProps {
  metrics: MetricData[];
  period: 'daily' | 'weekly' | 'monthly';
}

export const MetricsTable: React.FC<MetricsTableProps> = ({ metrics, period }) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[250px]">Metric</TableHead>
            <TableHead>Current Period</TableHead>
            <TableHead>Week to Date</TableHead>
            <TableHead>Last 7 Days</TableHead>
            <TableHead>Last 28 Days</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {metrics.map((metric) => (
            <TableRow key={metric.name}>
              <TableCell className="font-medium">{metric.name}</TableCell>
              <TableCell>{formatNumber(metric.currentValue)}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <span>{formatNumber(metric.weekToDate.value)}</span>
                  <TrendIndicator 
                    value={metric.weekToDate.change} 
                    format="percent" 
                    positive={metric.weekToDate.positive} 
                  />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <span>{formatNumber(metric.last7Days.value)}</span>
                  <TrendIndicator 
                    value={metric.last7Days.change} 
                    format="percent" 
                    positive={metric.last7Days.positive} 
                  />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <span>{formatNumber(metric.last28Days.value)}</span>
                  <TrendIndicator 
                    value={metric.last28Days.change} 
                    format="percent" 
                    positive={metric.last28Days.positive} 
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
