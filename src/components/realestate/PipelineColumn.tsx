
import React from 'react';
import { PropertyCard } from './PropertyCard';
import { RealEstateProperty, PropertyPhase } from '@/types/realEstate';

interface PipelineColumnProps {
  title: string;
  properties: RealEstateProperty[];
  onPropertyClick: (property: RealEstateProperty) => void;
}

// Function to get the appropriate background color based on the phase
const getPhaseColor = (phase: string): string => {
  switch(phase) {
    case '0. New Site':
      return 'bg-gray-200';
    case '1. Initial Diligence':
      return 'bg-blue-100';
    case '2. Survey':
      return 'bg-orange-200';
    case '3. Test Fit':
      return 'bg-purple-200';
    case '4. Plan Production':
      return 'bg-yellow-200';
    case '5. Permitting':
      return 'bg-blue-400 text-white';
    case '6. Construction':
      return 'bg-slate-600 text-white';
    case '7. Set Up':
      return 'bg-green-600 text-white';
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
  properties,
  onPropertyClick
}) => {
  const phaseColorClass = getPhaseColor(title);
  
  // Filter properties to only include those that match this column's phase
  const filteredProperties = properties.filter(property => property.phase === title);

  return (
    <div className="flex flex-col h-full">
      <div className={`p-2 rounded-t-md ${phaseColorClass}`}>
        <h3 className="font-medium text-center">{title}</h3>
        <div className={`text-xs text-center ${title === '0. New Site' || title === '1. Initial Diligence' || title === '2. Survey' || title === '3. Test Fit' || title === '4. Plan Production' ? 'text-gray-600' : 'text-gray-200'}`}>
          {filteredProperties.length} properties
        </div>
      </div>
      <div className="flex-1 bg-secondary/20 p-2 rounded-b-md overflow-auto max-h-[calc(100vh-220px)]">
        <div className="space-y-3">
          {filteredProperties.length > 0 ? (
            filteredProperties.map(property => (
              <PropertyCard 
                key={property.id} 
                property={property}
                onClick={() => onPropertyClick(property)} 
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
