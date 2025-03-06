
import { Stage } from '@/components/StageProgressBar';
import { PropertyPhase } from '@/types/realEstate';

// Map property phases to progress stages
export const getProgressStages = (): Stage[] => {
  return [
    {
      name: 'Diligence',
      isCompleted: false,
      isCurrent: false
    },
    {
      name: 'Test Fit',
      isCompleted: false,
      isCurrent: false
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
  
  // Reset all stages to default state
  stages.forEach(stage => {
    stage.isCompleted = false;
    stage.isCurrent = false;
  });
  
  // Determine which stages should be marked as completed or current based on the phase
  switch (phase) {
    case '0. New Site':
      // In initial phase
      stages[0].isCurrent = true;
      return stages;
    
    case '1. Initial Diligence':
      // In diligence phase
      stages[0].isCurrent = true;
      return stages;
      
    case '2. Survey':
      // Survey phase - Diligence is completed, Test Fit is current
      stages[0].isCompleted = true; 
      stages[1].isCurrent = true;
      return stages;
    
    case '3. Test Fit':
      // Test fit phase
      stages[0].isCompleted = true;
      stages[1].isCurrent = true;
      return stages;
      
    case '4. Plan Production':
      // Plan production phase
      stages[0].isCompleted = true;
      stages[1].isCompleted = true;
      stages[2].isCurrent = true;
      return stages;
      
    case '5. Permitting':
      // Permitting phase
      stages[0].isCompleted = true;
      stages[1].isCompleted = true;
      stages[2].isCompleted = true;
      stages[3].isCurrent = true;
      return stages;
      
    case '6. Construction':
      // Construction phase
      stages[0].isCompleted = true;
      stages[1].isCompleted = true;
      stages[2].isCompleted = true;
      stages[3].isCompleted = true;
      stages[4].isCurrent = true;
      return stages;
      
    case '7. Set Up':
      // Set up phase
      stages[0].isCompleted = true;
      stages[1].isCompleted = true;
      stages[2].isCompleted = true;
      stages[3].isCompleted = true;
      stages[4].isCompleted = true;
      stages[5].isCurrent = true;
      return stages;
      
    case 'Hold':
    case 'Deprioritize':
      // Other phases - just show diligence as current
      stages[0].isCurrent = true;
      return stages;
      
    default:
      return stages;
  }
};
