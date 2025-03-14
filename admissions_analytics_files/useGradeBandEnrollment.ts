import { useState, useEffect } from "react";
import { supabase } from "../integrations/supabase-client";

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

export const useGradeBandEnrollment = ({
  campusId,
}: GradeBandEnrollmentProps): GradeBandEnrollmentData => {
  const [data, setData] = useState<GradeBandEnrollmentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Debug input parameters
  useEffect(() => {
    console.log("%c useGradeBandEnrollment input params:", "color: orange; font-weight: bold", {
      campusId,
    });
  }, [campusId]);

  useEffect(() => {
    const fetchGradeBandData = async () => {
      try {
        console.log("Fetching grade band enrollment data...");
        setLoading(true);
        setError(null);

        console.log("Using grade_enrollment_summary view with campus filter:", campusId);

        // Query the view directly
        let query;
        let rawData;
        let queryError;

        if (campusId) {
          // Get data for specific campus - using SQL to specify schema
          const query = `
            SELECT 
              grade, 
              campus, 
              enrollment_count 
            FROM 
              fivetran_views.grade_enrollment_summary 
            WHERE 
              campus = '${campusId?.replace(/'/g, "''")}'
          `;

          const { data, error } = await supabase.rpc("execute_sql_query", {
            query_text: query,
          });

          rawData = data;
          queryError = error;
        } else {
          // Get data for all campuses - using SQL to sum up the counts
          const query = `
            SELECT 
              grade, 
              SUM(enrollment_count) as enrollment_count 
            FROM 
              fivetran_views.grade_enrollment_summary 
            GROUP BY 
              grade
          `;

          const { data, error } = await supabase.rpc("execute_sql_query", {
            query_text: query,
          });

          rawData = data;
          queryError = error;
        }

        console.log("Query response:", { rawData, queryError });

        if (queryError) {
          throw new Error(`SQL query error: ${queryError.message || "Unknown error"}`);
        }

        // Process the returned data and group into bands
        const gradeBandCounts: Record<string, number> = {
          "K-2": 0,
          "3-5": 0,
          "6-8": 0,
        };

        if (rawData && Array.isArray(rawData) && rawData.length > 0) {
          // Group the individual grades into bands - more robust handling of grade formats
          rawData.forEach((item) => {
            const grade = String(item.grade).trim(); // Ensure grade is a string and trim whitespace
            const count = parseInt(String(item.enrollment_count), 10) || 0;

            // Normalize grade - handle 'k', 'K', '0', 'TK', etc.
            const normalizedGrade = grade.toUpperCase();

            if (["K", "TK", "0", "1", "2"].includes(normalizedGrade)) {
              console.log(`Grade ${grade} mapped to K-2 band with count ${count}`);
              gradeBandCounts["K-2"] += count;
            } else if (["3", "4", "5"].includes(normalizedGrade)) {
              console.log(`Grade ${grade} mapped to 3-5 band with count ${count}`);
              gradeBandCounts["3-5"] += count;
            } else if (["6", "7", "8"].includes(normalizedGrade)) {
              console.log(`Grade ${grade} mapped to 6-8 band with count ${count}`);
              gradeBandCounts["6-8"] += count;
            } else {
              console.log(`Grade ${grade} not mapped to any band`);
            }
          });
        }

        // Convert to array format
        const resultData: GradeBandEnrollmentItem[] = Object.entries(gradeBandCounts).map(
          ([grade_band, enrollment_count]) => ({
            grade_band,
            enrollment_count,
          })
        );

        // Make sure we have entries for all expected grade bands, even if no data was returned
        const defaultGradeBands = ["K-2", "3-5", "6-8"];
        const finalData = defaultGradeBands.map((band) => {
          const existingData = resultData.find((item) => item.grade_band === band);
          if (existingData) {
            return existingData;
          } else {
            console.log(`No data found for grade band: ${band}, adding with count 0`);
            return {
              grade_band: band,
              enrollment_count: 0,
            };
          }
        });

        console.log("Final grade band data:", finalData);
        setData(finalData);
      } catch (err) {
        console.error("Error fetching grade band enrollment data:", err);
        // Create a new error with a more helpful message
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred";
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
