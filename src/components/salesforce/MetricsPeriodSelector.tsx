
import React from 'react';

interface MetricsPeriodSelectorProps {
  selectedPeriod: 'daily' | 'weekly' | 'monthly';
  onSelectPeriod: (period: 'daily' | 'weekly' | 'monthly') => void;
}

export const MetricsPeriodSelector: React.FC<MetricsPeriodSelectorProps> = ({
  selectedPeriod,
  onSelectPeriod
}) => {
  return (
    <div className="flex border rounded-md overflow-hidden">
      <button
        className={`px-4 py-1 text-sm ${
          selectedPeriod === 'daily' 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-secondary hover:bg-secondary/80'
        }`}
        onClick={() => onSelectPeriod('daily')}
      >
        Daily
      </button>
      <button
        className={`px-4 py-1 text-sm ${
          selectedPeriod === 'weekly' 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-secondary hover:bg-secondary/80'
        }`}
        onClick={() => onSelectPeriod('weekly')}
      >
        Weekly
      </button>
      <button
        className={`px-4 py-1 text-sm ${
          selectedPeriod === 'monthly' 
            ? 'bg-primary text-primary-foreground' 
            : 'bg-secondary hover:bg-secondary/80'
        }`}
        onClick={() => onSelectPeriod('monthly')}
      >
        Monthly
      </button>
    </div>
  );
};
