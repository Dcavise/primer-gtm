
import React from 'react';
import StageProgressBar, { Stage } from '@/components/StageProgressBar';

interface PropertyProgressProps {
  stages: Stage[];
}

const PropertyProgress: React.FC<PropertyProgressProps> = ({ stages }) => {
  if (stages.length === 0) return null;
  
  return (
    <div className="w-full mb-6">
      <StageProgressBar stages={stages} />
    </div>
  );
};

export default PropertyProgress;
