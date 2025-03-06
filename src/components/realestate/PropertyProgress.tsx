
import React from 'react';
import StageProgressBar, { Stage } from '@/components/StageProgressBar';
import { PropertyPhase } from '@/types/realEstate';
import { mapPhaseToProgressStages } from '@/components/PropertyProgressStages';

interface PropertyProgressProps {
  phase: PropertyPhase | null;
}

const PropertyProgress: React.FC<PropertyProgressProps> = ({ phase }) => {
  // Map the property phase to progress stages
  const stages = mapPhaseToProgressStages(phase);
  
  if (stages.length === 0) return null;
  
  return (
    <div className="w-full mb-6">
      <StageProgressBar stages={stages} />
    </div>
  );
};

export default PropertyProgress;
