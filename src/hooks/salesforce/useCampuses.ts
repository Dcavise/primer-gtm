
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Campus } from './types';

export const useCampuses = () => {
  const [campuses, setCampuses] = useState<Campus[]>([]);

  useEffect(() => {
    fetchCampuses();
  }, []);

  const fetchCampuses = async () => {
    try {
      // Since campus_id is now the primary key, we can rely on it for ordering
      const { data, error } = await supabase
        .from('campuses')
        .select('*')
        .order('campus_name');

      if (error) throw error;
      setCampuses(data || []);
    } catch (error) {
      console.error('Error fetching campuses:', error);
      toast.error('Failed to load campuses');
    }
  };

  return {
    campuses,
    fetchCampuses
  };
};
