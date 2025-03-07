import { useState } from 'react';
import { toast } from 'sonner';
import { Permit, ZoningData, School } from '@/types';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define the insight types
export type InsightType = 'opportunity' | 'risk' | 'recommendation';

// Define the insight interface
export interface PropertyInsight {
  type: InsightType;
  title: string;
  description: string;
}

// Define the hook return type
interface UseAiInsightsReturn {
  insights: PropertyInsight[];
  loading: boolean;
  error: Error | null;
  generateInsights: (params: {
    address: string;
    permits?: Permit[];
    zoningData?: ZoningData;
    schools?: School[];
  }) => Promise<void>;
  reset: () => void;
  toggleEdgeFunctionMode: () => boolean;
  getEdgeFunctionMode: () => boolean;
}

/**
 * Hook for generating AI-powered insights for property research
 * In a production environment, this would connect to an MCP server
 * for more sophisticated AI analysis
 */
export function useAiInsights(): UseAiInsightsReturn {
  const [insights, setInsights] = useState<PropertyInsight[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Reset the insights state
  const reset = () => {
    setInsights([]);
    setError(null);
  };

  // Generate insights based on property data
  const generateInsights = async (params: {
    address: string;
    permits?: Permit[];
    zoningData?: ZoningData;
    schools?: School[];
  }): Promise<void> => {
    const { address, permits, zoningData, schools } = params;
    
    // Reset any previous state
    setError(null);
    setLoading(true);
    
    try {
      // First try to use the Supabase edge function for AI analysis
      let generatedInsights: PropertyInsight[] = [];
      
      // Check if we should force using the edge function for testing
      // This allows us to test the edge function in development mode
      const forceEdgeFunction = localStorage.getItem('useEdgeFunction') === 'true';
      const isDevelopment = import.meta.env.DEV;
      
      // Log the current mode
      console.log(`AI Analysis Mode: ${forceEdgeFunction ? 'Edge Function (Forced)' : isDevelopment ? 'Local Development' : 'Production'}`);
      
      if (isDevelopment && !forceEdgeFunction) {
        // In development, use local analysis with a simulated delay
        console.log('Using local analysis in development mode');
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
        generatedInsights = generateLocalInsights(params);
      } else {
        // In production, try to use the Supabase edge function
        try {
          console.log('Calling AI property analysis edge function...');
          console.log('Supabase URL:', supabaseUrl);
          
          // Call the Supabase edge function for AI property analysis
          const { data, error } = await supabase.functions.invoke('ai-property-analysis', {
            body: { address, permits, zoningData, schools },
          });
          
          if (error) {
            console.error('Error calling AI analysis function:', error);
            throw new Error('Failed to call AI analysis function');
          }
          
          if (data && data.insights) {
            generatedInsights = data.insights;
            console.log('AI insights generated successfully:', generatedInsights);
          } else {
            throw new Error('Invalid response from AI analysis function');
          }
        } catch (apiError) {
          console.warn('Failed to use edge function, falling back to client-side analysis:', apiError);
          
          // Fallback to client-side analysis if the edge function fails
          toast.info("Using local analysis", {
            description: "Could not connect to AI server, using local analysis instead."
          });
          
          // Generate insights based on the available data
          generatedInsights = generateLocalInsights(params);
        }
      }
      
      // Update state with generated insights
      setInsights(generatedInsights);
      
      // Notify user that insights are ready
      toast.success("AI Analysis Complete", {
        description: "Property insights and recommendations are now available."
      });
    } catch (err) {
      console.error('Error generating AI insights:', err);
      setError(err instanceof Error ? err : new Error('Failed to generate insights'));
      
      toast.error("Analysis Error", {
        description: "There was a problem generating AI insights for this property."
      });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Generate insights locally (fallback method)
   */
  const generateLocalInsights = (params: {
    address: string;
    permits?: Permit[];
    zoningData?: ZoningData;
    schools?: School[];
  }): PropertyInsight[] => {
    const { address, permits, zoningData, schools } = params;
    const insights: PropertyInsight[] = [];
    
    // Add zoning-based insights if available
    if (zoningData) {
      if (zoningData.zone_code && zoningData.zone_code.includes('R')) {
        insights.push({
          type: 'opportunity',
          title: 'Residential Development Potential',
          description: 'This property is zoned for residential use, which aligns with current market demand for housing in this area.'
        });
      }
      
      if (zoningData.zone_code && zoningData.zone_code.includes('C')) {
        insights.push({
          type: 'opportunity',
          title: 'Commercial Opportunity',
          description: 'Commercial zoning presents opportunities for retail, office, or mixed-use development, potentially yielding higher returns than residential-only properties.'
        });
      }
      
      // Add a recommendation based on zoning restrictions
      insights.push({
        type: 'recommendation',
        title: 'Zoning Compliance Review',
        description: `Review the specific requirements of the ${zoningData.zone_code || 'current'} zoning designation to ensure your planned use complies with local regulations.`
      });
    }
    
    // Add permit-based insights if available
    if (permits && permits.length > 0) {
      // Check for recent permits
      const recentPermits = permits.filter(p => {
        const permitDate = p.issue_date ? new Date(p.issue_date) : null;
        return permitDate && (new Date().getTime() - permitDate.getTime()) < (2 * 365 * 24 * 60 * 60 * 1000); // 2 years
      });
      
      if (recentPermits.length > 0) {
        insights.push({
          type: 'risk',
          title: 'Recent Construction Activity',
          description: 'There have been recent permits issued for this property, which may indicate ongoing construction or renovations. Consider conducting a thorough inspection.'
        });
      }
      
      // Check for permit types that might indicate issues
      const hasStructuralPermits = permits.some(p => 
        p.permit_type?.toLowerCase().includes('structural') || 
        p.description?.toLowerCase().includes('foundation') ||
        p.description?.toLowerCase().includes('structural')
      );
      
      if (hasStructuralPermits) {
        insights.push({
          type: 'risk',
          title: 'Structural Modifications',
          description: 'This property has permits for structural modifications, which may warrant additional engineering inspection to ensure work was completed properly.'
        });
      }
    }
    
    // Add school-based insights if available
    if (schools && schools.length > 0) {
      const highRatedSchools = schools.filter(s => s.rating && s.rating >= 8);
      const lowRatedSchools = schools.filter(s => s.rating && s.rating <= 4);
      
      if (highRatedSchools.length > 0) {
        insights.push({
          type: 'opportunity',
          title: 'High-Quality School District',
          description: 'This property is located near highly-rated schools, which can positively impact property value and rental potential, especially for family-oriented housing.'
        });
      } else if (lowRatedSchools.length > 0) {
        insights.push({
          type: 'risk',
          title: 'School Quality Consideration',
          description: 'The nearby schools have below-average ratings, which may affect the property\'s appeal to families with school-age children.'
        });
      }
    }
    
    // Always add some general recommendations
    insights.push({
      type: 'recommendation',
      title: 'Comprehensive Due Diligence',
      description: 'Consider ordering a professional property inspection, title search, and environmental assessment to identify any potential issues not covered in public records.'
    });
    
    // If we don't have much data, add a note about that
    if (!zoningData && (!permits || permits.length === 0) && (!schools || schools.length === 0)) {
      insights.push({
        type: 'recommendation',
        title: 'Limited Data Available',
        description: 'There is limited public data available for this property. Consider contacting the local planning department directly for more comprehensive information.'
      });
    }
    
    return insights;
  };

  /**
   * Toggle between using the edge function and local analysis
   * This is useful for testing the edge function in development mode
   */
  const toggleEdgeFunctionMode = () => {
    const currentMode = localStorage.getItem('useEdgeFunction') === 'true';
    localStorage.setItem('useEdgeFunction', (!currentMode).toString());
    toast.success(`AI Analysis Mode: ${!currentMode ? 'Edge Function' : 'Local Analysis'}`, {
      description: `Now using ${!currentMode ? 'server-side' : 'client-side'} analysis for property insights.`
    });
    return !currentMode;
  };

  /**
   * Get the current edge function mode
   */
  const getEdgeFunctionMode = () => {
    return localStorage.getItem('useEdgeFunction') === 'true';
  };

  return {
    insights,
    loading,
    error,
    generateInsights,
    reset,
    toggleEdgeFunctionMode,
    getEdgeFunctionMode
  };
}
