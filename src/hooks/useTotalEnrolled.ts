import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase-client';

type UseTotalEnrolledOptions = {
  campusId: string | null;
  enabled?: boolean;
  refetchKey?: number;
};

type TotalEnrolledResponse = {
  count: number;
  loading: boolean;
  error: Error | null;
};

/**
 * Hook to fetch the total number of enrolled students
 * Counts distinct opportunities that:
 * - Have stage_name = 'Closed Won'
 * - Have school_year_c = '25/26'
 * With optional campus filtering
 */
export function useTotalEnrolled({
  campusId = null,
  enabled = true,
  refetchKey = 0,
}: UseTotalEnrolledOptions): TotalEnrolledResponse {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    
    async function fetchData() {
      try {
        setLoading(true);
        
        // Build the query to count distinct opportunity IDs
        let query = `
          SELECT COUNT(DISTINCT id) as enrolled_count
          FROM fivetran_views.opportunity
          WHERE stage_name = 'Closed Won'
          AND school_year_c = '25/26'
        `;
        
        // Add campus filter if provided
        if (campusId !== null) {
          // Ensure we're properly escaping single quotes for SQL
          const escapedCampusId = campusId.replace(/'/g, "''");
          query += ` AND preferred_campus_c = '${escapedCampusId}'`;
        }
        
        console.log('EXECUTING TOTAL ENROLLED QUERY:');
        console.log(query);
        
        // Execute the query - use the function directly with no schema prefix
        const { data: rawData, error: queryError } = await supabase.rpc('execute_sql_query', {
          sql_query: query  // Using the correct parameter name 'sql_query' instead of 'query_text'
        });
        
        console.log('Total enrolled query response:', { rawData, queryError });
        
        if (queryError) {
          console.error('Query error details:', queryError);
          throw new Error(`SQL query error: ${queryError.message || 'Unknown error'}`);
        }
        
        // Check if we have valid data
        if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
          console.warn('No data returned from total enrolled query');
          setCount(0);
          setError(null);
          setLoading(false);
          return;
        }
        
        // Extract the count from the first row
        const enrolledCount = Number(rawData[0].enrolled_count) || 0;
        setCount(enrolledCount);
        setError(null);
      } catch (err) {
        console.error('Error fetching total enrolled count:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setCount(0);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [campusId, enabled, refetchKey]);

  return { count, loading, error };
}
