import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase-client';

type GradeBandEnrollmentItem = {
  grade_band: string;
  enrollment_count: number;
};

type GradeBandEnrollmentData = {
  data: GradeBandEnrollmentItem[];
  loading: boolean;
  error: Error | null;
};

type GradeBandEnrollmentProps = {
  campusId: string | null;
};

export const useGradeBandEnrollment = ({ campusId }: GradeBandEnrollmentProps): GradeBandEnrollmentData => {
  const [data, setData] = useState<GradeBandEnrollmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Debug input parameters
  useEffect(() => {
    console.log('%c useGradeBandEnrollment input params:', 'color: orange; font-weight: bold', { campusId });
  }, [campusId]);
  
  useEffect(() => {
    const fetchGradeBandData = async () => {
      try {
        console.log('Fetching grade band enrollment data...');
        setLoading(true);
        setError(null);

        // Use the new grade_band_enrollment_summary view
        let query = `
          SELECT 
            grade_band, 
            SUM(enrollment_count) AS enrollment_count 
          FROM 
            fivetran_views.grade_band_enrollment_summary
        `;

        // Add campus filter if provided
        if (campusId !== null) {
          // Ensure we're properly escaping single quotes for SQL
          const escapedCampusId = campusId.replace(/'/g, "''");
          query += ` WHERE preferred_campus_c = '${escapedCampusId}'`;
        }

        // Complete the query with GROUP BY and ORDER BY
        query += `
          GROUP BY 
            grade_band, 
            sort_order 
          ORDER BY 
            sort_order;
        `;
        
        console.log('%c EXECUTING GRADE BAND ENROLLMENT QUERY:', 'color: blue; font-weight: bold');
        console.log(query);

        const { data: rawData, error: queryError } = await supabase.rpc('execute_sql_query', { query_text: query });
        
        console.log('%c Grade band query response:', 'color: green; font-weight: bold', { rawData, queryError });
        console.log('Raw data type:', typeof rawData, Array.isArray(rawData));
        if (rawData) {
          console.log('Raw data length:', rawData.length);
          if (rawData.length > 0) {
            console.log('First item:', rawData[0]);
          }
        }
        
        if (queryError) {
          console.error('Query error details:', queryError);
          throw new Error(`SQL query error: ${queryError.message || 'Unknown error'}`);
        }
        
        // Check if we have valid data
        if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
          console.warn('No data returned from grade band query');
          setData([]);
          setError(null);
          setLoading(false);
          return;
        }
        
        // Parse and format the data
        const formattedData = rawData.map((item: { grade_band: string; enrollment_count: string }) => {
          // Ensure we have a clean grade band label
          const gradeBand = item.grade_band?.trim() || 'Unknown';
          // Convert enrollment count to a number and default to 0 if conversion fails
          const count = Number(item.enrollment_count) || 0;
          
          return {
            grade_band: gradeBand,
            enrollment_count: count
          };
        });
        
        console.log('Formatted grade band data:', formattedData);
        setData(formattedData);
      } catch (err) {
        console.error('Error fetching grade band enrollment data:', err);
        // Create a new error with a more helpful message
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
        setError(new Error(`Failed to fetch grade band enrollment data: ${errorMessage}`));
        // Set empty data to prevent component errors
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGradeBandData();
  }, [campusId]);

  return { data, loading, error };
};
