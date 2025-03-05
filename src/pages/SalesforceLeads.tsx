
const syncSalesforceLeads = async () => {
  setSyncLoading(true);
  setSyncError(null);
  setShowDetailedError(false);
  
  try {
    console.log("Invoking sync-salesforce-leads function");
    const response = await supabase.functions.invoke('sync-salesforce-leads');
    
    if (response.error) {
      console.error("Edge function error:", response.error);
      throw new Error(response.error.message || 'Unknown error occurred');
    }
    
    if (!response.data.success) {
      console.error("Sync operation failed:", response.data);
      throw new Error(response.data.error || 'Sync operation failed');
    }
    
    let successMessage = `Successfully synced ${response.data.synced || 0} leads, matched ${response.data.matched || 0} with campuses`;
    
    if (response.data.fixed && response.data.fixed > 0) {
      successMessage += `, fixed ${response.data.fixed} lead campus ID mappings`;
    }
    
    if (response.data.fixedOpportunities && response.data.fixedOpportunities > 0) {
      successMessage += `, fixed ${response.data.fixedOpportunities} opportunity campus ID mappings`;
    }
    
    if (response.data.fixedFellows && response.data.fixedFellows > 0) {
      successMessage += `, fixed ${response.data.fixedFellows} fellow campus ID mappings`;
    }
    
    if (response.data.cleaned && response.data.cleaned > 0) {
      successMessage += `, cleaned ${response.data.cleaned} invalid campus references`;
    }
    
    toast.success(successMessage);
    
    fetchLeads(selectedCampusId || undefined);
    fetchCampuses();
  } catch (error: any) {
    console.error('Error syncing Salesforce leads:', error);
    const errorMessage = error.message || 'Unknown error occurred';
    setSyncError(errorMessage);
    toast.error(`Error syncing leads data: ${errorMessage}`);
  } finally {
    setSyncLoading(false);
  }
};
