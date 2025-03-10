import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase-client';
import { Campus } from '@/types';
import { toast } from 'sonner';
import { logger } from '@/utils/logger';
import { handleError, tryCatch, ErrorType } from '@/utils/error-handler';

// Query key for type safety and reuse
export const CAMPUS_QUERY_KEY = ['campuses'] as const;

/**
 * Fetch campuses function that can be used outside of React components
 */
export async function fetchCampuses(): Promise<Campus[]> {
  try {
    // Get unique campus names directly from the lead table's preferred_campus_c field
    const { data: campusData, error: campusError } = await supabase.rpc('execute_sql_query', {
      query: `SELECT DISTINCT preferred_campus_c as campus_name
              FROM fivetran_views.lead
              WHERE preferred_campus_c IS NOT NULL
              ORDER BY preferred_campus_c`
    });
    
    if (campusError) {
      logger.error('Error fetching campus data from lead table:', campusError);
      throw new Error('Failed to fetch campus data');
    }
    
    // Map results to the expected Campus interface format
    const campuses = campusData.map(item => ({
      campus_id: item.campus_name, // Use the campus name as the ID for filtering
      campus_name: item.campus_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    logger.debug('Fetched', campuses.length, 'campuses from lead table');
    return campuses;
  } catch (err) {
    logger.error('Error in fetchCampuses:', err);
    handleError({
      message: 'Failed to fetch campuses data: ' + (err instanceof Error ? err.message : String(err))
    }, false, { context: 'fetchCampuses' });
    throw new Error('Failed to fetch campuses data');
  }
}

/**
 * Hook for fetching and managing campus data
 * @returns Campus data query with refetch function
 */
export const useCampuses = () => {
  const queryClient = useQueryClient();
  
  const query = useQuery({
    queryKey: CAMPUS_QUERY_KEY,
    queryFn: fetchCampuses,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
  
  // Manual refresh function that shows a toast notification
  const refreshCampuses = async (): Promise<boolean> => {
    return tryCatch(
      async () => {
        await queryClient.refetchQueries({ queryKey: CAMPUS_QUERY_KEY });
        toast.success('Campus data refreshed');
        return true;
      },
      'Failed to refresh campuses',
      true,
      { context: 'refreshCampuses' }
    ) !== null;
  };
  
  return {
    ...query,
    campuses: query.data || [],
    refreshCampuses
  };
};