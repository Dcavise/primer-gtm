
import { supabase } from '@/integrations/supabase/client';
import { OpportunityStageCount } from './types';

export const fetchOpportunitiesStats = async (
  selectedCampusId: string | null,
  handleError: (error: any, message?: string) => void
) => {
  try {
    // Fetch active opportunities count
    let activeOppsQuery = supabase
      .from('salesforce_opportunities')
      .select('opportunity_id', { count: 'exact', head: true })
      .not('stage', 'in', '("Closed Won","Closed Lost")');
    
    if (selectedCampusId) {
      activeOppsQuery = activeOppsQuery.eq('campus_id', selectedCampusId);
    }
    
    const { count: activeOppsCount, error: activeOppsError } = await activeOppsQuery;
    
    if (activeOppsError) throw activeOppsError;
    
    // Fetch opportunity stages counts
    let stagesQuery = supabase
      .from('salesforce_opportunities')
      .select('stage, opportunity_id')
      .not('stage', 'in', '("Closed Won","Closed Lost")');
    
    if (selectedCampusId) {
      stagesQuery = stagesQuery.eq('campus_id', selectedCampusId);
    }
    
    const { data: stagesData, error: stagesError } = await stagesQuery;
    
    let opportunityStageCounts: OpportunityStageCount[] = [];
    
    if (stagesError) throw stagesError;
    
    if (stagesData) {
      // Group by stage and count
      const stageCounts: Record<string, number> = {};
      
      // Initialize with the required stages to ensure they appear in the result even if count is 0
      const requiredStages = ["Family Interview", "Awaiting Documents", "Preparing Offer", "Admission Offered"];
      requiredStages.forEach(stage => {
        stageCounts[stage] = 0;
      });
      
      // Count occurrences of each stage
      stagesData.forEach(opportunity => {
        if (opportunity.stage) {
          stageCounts[opportunity.stage] = (stageCounts[opportunity.stage] || 0) + 1;
        }
      });
      
      // Convert to array and sort according to required order
      opportunityStageCounts = requiredStages
        .filter(stage => stageCounts[stage] !== undefined)
        .map(stage => ({
          stage,
          count: stageCounts[stage]
        }));
      
      console.log("Opportunity stages counts:", opportunityStageCounts);
    }

    // Fetch closed won opportunities count
    let closedWonOppsQuery = supabase
      .from('salesforce_opportunities')
      .select('opportunity_id', { count: 'exact', head: true })
      .eq('stage', 'Closed Won');
    
    if (selectedCampusId) {
      closedWonOppsQuery = closedWonOppsQuery.eq('campus_id', selectedCampusId);
    }
    
    const { count: closedWonOppsCount, error: closedWonOppsError } = await closedWonOppsQuery;
    
    if (closedWonOppsError) throw closedWonOppsError;
    
    return { 
      activeOpportunitiesCount: activeOppsCount || 0, 
      closedWonOpportunitiesCount: closedWonOppsCount || 0,
      opportunityStageCounts
    };
  } catch (error) {
    handleError(error, 'Error fetching opportunities stats');
    return { 
      activeOpportunitiesCount: 0, 
      closedWonOpportunitiesCount: 0,
      opportunityStageCounts: []
    };
  }
};
