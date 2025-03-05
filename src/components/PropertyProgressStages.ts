
import { Stage } from '@/components/StageProgressBar';

export const getProgressStages = (): Stage[] => {
  return [
    {
      id: 'diligence',
      title: 'Diligence',
      description: 'Initial research and survey',
      status: 'complete',
    },
    {
      id: 'test-fit',
      title: 'Test Fit',
      description: 'Space planning and design',
      status: 'active',
    },
    {
      id: 'plan-production',
      title: 'Plan Production',
      description: 'Creating detailed documents',
      status: 'pending',
    },
    {
      id: 'permitting',
      title: 'Permitting',
      description: 'Obtaining necessary approvals',
      status: 'pending',
    },
    {
      id: 'construction',
      title: 'Construction',
      description: 'Building and developing',
      status: 'pending',
    },
    {
      id: 'setup',
      title: 'Set Up',
      description: 'Final preparations',
      status: 'pending',
    },
  ];
};
