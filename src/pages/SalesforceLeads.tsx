
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
    
    const syncedAccounts = response.data.accounts || 0;
    const syncedContacts = response.data.contacts || 0;
    const fixedCount = response.data.fixed || 0;
    
    let successMessage = `Successfully synced ${response.data.synced || 0} leads, matched ${response.data.matched || 0} with campuses`;
    
    if (fixedCount > 0) {
      successMessage += `, fixed ${fixedCount} campus ID mappings`;
    }
    
    successMessage += `, and synced ${syncedAccounts} accounts and ${syncedContacts} contacts`;
    
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
