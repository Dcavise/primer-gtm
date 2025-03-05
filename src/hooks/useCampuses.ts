
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Campus } from '@/types';

export const useCampuses = () => {
  return useQuery({
    queryKey: ['campuses'],
    queryFn: async (): Promise<Campus[]> => {
      const { data, error } = await supabase
        .from('campuses')
        .select('*')
        .order('campus_name', { ascending: true });
      
      if (error) {
        console.error('Error fetching campuses:', error);
        throw new Error('Failed to fetch campuses data');
      }
      
      return data || [];
    }
  });
};
