
import { supabase } from '@/integrations/supabase/client';
import { OpportunityStageCount } from './types';

export const fetchOpportunitiesStats = async (
  selectedCampusId: string | null,
  handleError: (error: any, message?: string) => void
) => {
  try {
    // Instead of direct table access, use RPC functions
    let opportunityStageCounts: OpportunityStageCount[] = [];
    let activeOpportunitiesCount = 0;
    let closedWonOpportunitiesCount = 0;
    
    // Fetch opportunity stages data using the RPC function
    const { data: stagesData, error: stagesError } = await supabase
      .rpc('get_opportunities_by_stage_campus');
    
    if (stagesError) {
      throw stagesError;
    }
    
    if (stagesData) {
      // Filter the data for the selected campus
      let filteredData = stagesData;
      if (selectedCampusId) {
        filteredData = stagesData.filter((item: any) => 
          item.campus_id === selectedCampusId
        );
      }
      
      // Group and count by stage
      const stageCounts: Record<string, number> = {};
      const requiredStages = ["Family Interview", "Awaiting Documents", "Preparing Offer", "Admission Offered"];
      
      // Initialize with required stages
      requiredStages.forEach(stage => {
        stageCounts[stage] = 0;
      });
      
      // Sum up the counts for each stage
      filteredData.forEach((item: any) => {
        if (requiredStages.includes(item.stage_name)) {
          stageCounts[item.stage_name] = (stageCounts[item.stage_name] || 0) + Number(item.count);
        }
        
        // Also count active opportunities (those not in Closed stages)
        if (item.stage_name !== 'Closed Won' && item.stage_name !== 'Closed Lost') {
          activeOpportunitiesCount += Number(item.count);
        }
        
        // Count closed won opportunities
        if (item.stage_name === 'Closed Won') {
          closedWonOpportunitiesCount += Number(item.count);
        }
      });
      
      // Format the data for the component
      opportunityStageCounts = requiredStages
        .map(stage => ({
          stage,
          count: stageCounts[stage] || 0
        }));
    }
    
    // If we couldn't get the active and closed won counts from the RPC data,
    // get them through a separate closed won stats call
    if (closedWonOpportunitiesCount === 0) {
      const { data: closedWonData, error: closedWonError } = await supabase
        .rpc('get_closed_won_by_campus');
      
      if (!closedWonError && closedWonData) {
        let filteredClosedWonData = closedWonData;
        if (selectedCampusId) {
          filteredClosedWonData = closedWonData.filter((item: any) => 
            item.campus_id === selectedCampusId
          );
        }
        
        closedWonOpportunitiesCount = filteredClosedWonData.reduce(
          (sum: number, item: any) => sum + Number(item.closed_won_count), 0
        );
      }
    }

    return { 
      activeOpportunitiesCount, 
      closedWonOpportunitiesCount,
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
