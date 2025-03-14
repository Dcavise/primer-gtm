#\!/bin/bash

# Create a directory to store the files
mkdir -p admissions_analytics_files

# Copy all relevant files
cp src/pages/AdmissionsAnalytics.tsx admissions_analytics_files/
cp src/features/admissionsAnalytics/routes.tsx admissions_analytics_files/ 2>/dev/null || echo "routes file not found"
cp src/hooks/useCampuses.ts admissions_analytics_files/
cp src/hooks/useFormattedLeadsMetrics.ts admissions_analytics_files/
cp src/hooks/useFormattedConvertedLeadsMetrics.ts admissions_analytics_files/
cp src/hooks/useFormattedClosedWonMetrics.ts admissions_analytics_files/
cp src/hooks/useFormattedArrMetrics.ts admissions_analytics_files/
cp src/hooks/useFormattedCumulativeARRMetrics.ts admissions_analytics_files/
cp src/hooks/useTotalEnrolled.ts admissions_analytics_files/
cp src/hooks/useGradeBandEnrollment.ts admissions_analytics_files/
cp src/utils/dateUtils.ts admissions_analytics_files/
cp src/utils/salesforce-fivetran-access.ts admissions_analytics_files/
cp src/integrations/supabase-client.ts admissions_analytics_files/
cp src/components/LoadingState.tsx admissions_analytics_files/ 2>/dev/null || echo "LoadingState file not found"
cp src/components/ErrorState.tsx admissions_analytics_files/ 2>/dev/null || echo "ErrorState file not found"

# Create a zip file
zip -r admissions_analytics_files.zip admissions_analytics_files

# Clean up the directory
rm -rf admissions_analytics_files

echo "All files have been zipped to admissions_analytics_files.zip"

