
import { Stage } from '@/components/StageProgressBar';
import { PropertyPhase } from '@/types/realEstate';

// Map property phases to progress stages
export const getProgressStages = (): Stage[] => {
  return [
    {
      name: 'Diligence',
      isCompleted: true,
      isCurrent: false
    },
    {
      name: 'Test Fit',
      isCompleted: false,
      isCurrent: true
    },
    {
      name: 'Plan Production',
      isCompleted: false,
      isCurrent: false
    },
    {
      name: 'Permitting',
      isCompleted: false,
      isCurrent: false
    },
    {
      name: 'Construction',
      isCompleted: false,
      isCurrent: false
    },
    {
      name: 'Set Up',
      isCompleted: false,
      isCurrent: false
    },
  ];
};

// This function maps a property's phase to the corresponding progress stages
export const mapPhaseToProgressStages = (phase: PropertyPhase | null): Stage[] => {
  const stages = getProgressStages();
  
  if (!phase) return stages;
  
  // Determine which stages should be marked as completed or current based on the phase
  switch (phase) {
    case '0. New Site':
    case '1. Initial Diligence':
    case '2. Survey':
      // In diligence phase
      stages[0].isCompleted = false;
      stages[0].isCurrent = true;
      return stages;
    
    case '3. Test Fit':
      // Test fit phase
      stages[0].isCompleted = true;
      stages[1].isCompleted = false;
      stages[1].isCurrent = true;
      return stages;
      
    case '4. Plan Production':
      // Plan production phase
      stages[0].isCompleted = true;
      stages[1].isCompleted = true;
      stages[2].isCompleted = false;
      stages[2].isCurrent = true;
      return stages;
      
    case '5. Permitting':
      // Permitting phase
      stages[0].isCompleted = true;
      stages[1].isCompleted = true;
      stages[2].isCompleted = true;
      stages[3].isCompleted = false;
      stages[3].isCurrent = true;
      return stages;
      
    case '6. Construction':
      // Construction phase
      stages[0].isCompleted = true;
      stages[1].isCompleted = true;
      stages[2].isCompleted = true;
      stages[3].isCompleted = true;
      stages[4].isCompleted = false;
      stages[4].isCurrent = true;
      return stages;
      
    case '7. Set Up':
      // Set up phase
      stages[0].isCompleted = true;
      stages[1].isCompleted = true;
      stages[2].isCompleted = true;
      stages[3].isCompleted = true;
      stages[4].isCompleted = true;
      stages[5].isCompleted = false;
      stages[5].isCurrent = true;
      return stages;
      
    default:
      return stages;
  }
};
