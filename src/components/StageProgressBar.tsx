
import React from 'react';
import { Check } from 'lucide-react';

export type Stage = {
  name: string;
  isCompleted?: boolean;
  isCurrent?: boolean;
};

interface StageProgressBarProps {
  stages: Stage[];
}

const StageProgressBar: React.FC<StageProgressBarProps> = ({ stages }) => {
  return (
    <div className="w-full mb-6">
      <div className="relative flex items-center justify-between">
        {/* Connector line */}
        <div className="absolute left-0 right-0 h-1 bg-slate-200 top-1/2 transform -translate-y-1/2 z-0"></div>
        
        {/* Stages */}
        {stages.map((stage, index) => (
          <div 
            key={index} 
            className="relative z-10 flex flex-col items-center"
          >
            {/* Circle indicator */}
            <div 
              className={`w-6 h-6 rounded-full flex items-center justify-center mb-1
                ${stage.isCompleted ? 'bg-blue-600 text-white' : 
                  stage.isCurrent ? 'bg-blue-500 text-white border-2 border-blue-300' : 
                  'bg-slate-200 text-slate-500'}`}
            >
              {stage.isCompleted ? (
                <Check className="h-4 w-4" />
              ) : (
                <span className="text-xs">{index + 1}</span>
              )}
            </div>
            
            {/* Stage name */}
            <span 
              className={`text-xs font-medium whitespace-nowrap mt-1 px-2 py-1 rounded
                ${stage.isCurrent ? 'bg-blue-500 text-white' : 'text-slate-700'}`}
            >
              {stage.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StageProgressBar;
