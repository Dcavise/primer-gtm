
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { RealEstateProperty } from '@/types/realEstate';

export const useRealEstatePipeline = () => {
  return useQuery({
    queryKey: ['real-estate-pipeline'],
    queryFn: async (): Promise<RealEstateProperty[]> => {
      const { data, error } = await supabase
        .from('real_estate_pipeline')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching real estate pipeline:', error);
        throw new Error('Failed to fetch real estate pipeline data');
      }
      
      return data || [];
    }
  });
};
