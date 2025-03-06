
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealEstateProperty } from '@/types/realEstate';

interface UseRealEstatePipelineOptions {
  campusId?: string | null;
}

export const useRealEstatePipeline = (options: UseRealEstatePipelineOptions = {}) => {
  const { campusId } = options;
  
  return useQuery({
    queryKey: ['real-estate-pipeline', { campusId }],
    queryFn: async (): Promise<RealEstateProperty[]> => {
      let query = supabase
        .from('real_estate_pipeline')
        .select('*')
        .order('created_at', { ascending: false });
      
      // Apply campus filter if campusId is provided
      if (campusId) {
        query = query.eq('campus_id', campusId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching real estate pipeline:', error);
        throw new Error('Failed to fetch real estate pipeline data');
      }
      
      // Log some information for debugging purposes
      if (data && data.length > 0) {
        console.log(`Fetched ${data.length} real estate properties`);
        
        // Count properties by phase to help diagnose the issue
        const phaseCount: Record<string, number> = {};
        data.forEach(property => {
          const phase = property.phase || 'Unspecified';
          phaseCount[phase] = (phaseCount[phase] || 0) + 1;
        });
        console.log('Properties by phase:', phaseCount);
        
        if (campusId) {
          console.log(`Filtered by campus ID: ${campusId}, found ${data.length} properties`);
        }
      }
      
      return data || [];
    },
    // Enable automatic refetching
    refetchOnWindowFocus: true,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
  });
};
