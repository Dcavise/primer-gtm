
import React from 'react';
import { PropertyCard } from './PropertyCard';
import { RealEstateProperty } from '@/types/realEstate';
import { getPhaseColorClass } from './PhaseSelector';

interface PipelineColumnProps {
  title: string;
  properties: RealEstateProperty[];
}

export const PipelineColumn: React.FC<PipelineColumnProps> = ({
  title,
  properties
}) => {
  const phaseColorClass = getPhaseColorClass(title);
  const textColorClass = title === '0. New Site' ? 'text-gray-800' : 'text-white';

  return (
    <div className="flex flex-col h-full">
      <div className={`p-2 rounded-t-md ${phaseColorClass}`}>
        <h3 className={`font-medium text-center ${textColorClass}`}>{title}</h3>
        <div className={`text-xs text-center ${textColorClass} opacity-80`}>
          {properties.length} properties
        </div>
      </div>
      <div className="flex-1 bg-secondary/20 p-2 rounded-b-md overflow-auto max-h-[calc(100vh-220px)]">
        <div className="space-y-3">
          {properties.length > 0 ? (
            properties.map(property => (
              <PropertyCard 
                key={property.id} 
                property={property}
              />
            ))
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No properties in this phase
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
