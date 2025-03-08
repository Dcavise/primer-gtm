import { useCampuses as useGlobalCampuses } from '@/hooks/useCampuses';

/**
 * @deprecated Use the root level useCampuses hook instead
 * This is a temporary wrapper to maintain backward compatibility 
 * while we migrate to the consolidated hook
 */
export const useCampuses = () => {
  return useGlobalCampuses();
};