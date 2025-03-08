
import React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';

interface TrendIndicatorProps {
  value: number;
  format?: 'number' | 'percent' | 'currency';
  positive?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  hideIcon?: boolean;
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({ 
  value, 
  format = 'number', 
  positive, 
  size = 'md',
  showValue = true,
  hideIcon = false
}) => {
  // If positive is explicitly passed, use it, otherwise determine by value
  const isPositive = positive !== undefined ? positive : value >= 0;
  const absValue = Math.abs(value);
  
  // Format the value based on format type
  let formattedValue: string;
  switch (format) {
    case 'percent':
      formattedValue = `${absValue.toFixed(1)}%`;
      break;
    case 'currency':
      formattedValue = `$${absValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      break;
    default:
      formattedValue = absValue.toLocaleString('en-US');
  }
  
  // Size settings
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };
  
  // Background color classes
  const bgColorClass = isPositive ? 'bg-green-100' : 'bg-red-100';
  const textColorClass = isPositive ? 'text-green-700' : 'text-red-700';
  
  return (
    <div className={`flex items-center px-2 py-0.5 rounded ${bgColorClass} ${textColorClass} ${sizeClasses[size]}`}>
      {!hideIcon && (
        isPositive ? (
          <ArrowUp className="h-3 w-3 mr-1" />
        ) : (
          <ArrowDown className="h-3 w-3 mr-1" />
        )
      )}
      {showValue && <span>{formattedValue}</span>}
    </div>
  );
};
