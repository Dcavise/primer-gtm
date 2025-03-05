
import React from 'react';
import { PropertyCard } from './PropertyCard';
import { RealEstateProperty, PropertyPhase } from '@/types/realEstate';

interface PipelineColumnProps {
  title: string;
  properties: RealEstateProperty[];
}

// Function to get the appropriate background color based on the phase
const getPhaseColor = (phase: string): string => {
  switch(phase) {
    case '0. New Site':
      return 'bg-gray-200 text-gray-800';
    case '1. Initial Diligence':
      return 'bg-[#1F77B4] text-white';
    case '2. Survey':
      return 'bg-[#FF7F0E] text-white';
    case '3. Test Fit':
      return 'bg-[#9467BD] text-white';
    case '4. Plan Production':
      return 'bg-[#2CA02C] text-white';
    case '5. Permitting':
      return 'bg-[#1F77B4] text-white';
    case '6. Construction':
      return 'bg-[#495057] text-white';
    case '7. Set Up':
      return 'bg-[#2CA02C] text-white';
    case 'Hold':
      return 'bg-amber-800 text-white';
    case 'Deprioritize':
      return 'bg-gray-700 text-white';
    default:
      return 'bg-secondary';
  }
};

export const PipelineColumn: React.FC<PipelineColumnProps> = ({
  title,
  properties
}) => {
  const phaseColorClass = getPhaseColor(title);
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
