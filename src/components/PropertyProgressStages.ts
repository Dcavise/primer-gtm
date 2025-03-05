
import { Stage } from '@/components/StageProgressBar';

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
