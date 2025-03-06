import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { SalesforceConnectionTest } from '@/components/salesforce/ConnectionTest';
import { SupabaseConnectionTest } from '@/components/salesforce/SupabaseConnectionTest';
import { DatabaseConnectionAlert } from '@/components/salesforce/DatabaseConnectionAlert';
import { LeadsDataTable } from '@/components/salesforce/LeadsDataTable';
import { LeadsStats } from '@/components/salesforce/LeadsStats';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { testSalesforceConnection } from '@/utils/test-salesforce';
import SimpleDatabaseTest from "@/components/salesforce/SimpleDatabaseTest";
import { logger } from '@/utils/logger';

// Mock campuses data (in production this would come from an API or context)
const CAMPUSES = [
  { id: 'all', name: 'All Campuses' },
  { id: 'austin', name: 'Austin' },
  { id: 'dallas', name: 'Dallas' },
  { id: 'houston', name: 'Houston' },
  { id: 'san-antonio', name: 'San Antonio' },
];

const SalesforceLeadsPage: React.FC = () => {
  const [selectedCampus, setSelectedCampus] = useState('all');
  const [activeTab, setActiveTab] = useState('test');  // Set default to test tab for debugging
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalLeads: 0,
    openLeads: 0,
    convertedLeads: 0,
    byCampus: {},
    bySource: {},
  });
  
  useEffect(() => {
    loadStats();
  }, []);
  
  const loadStats = async () => {
    setLoading(true);
    
    try {
      // Test connection to determine which client to use
      const testResults = await testSalesforceConnection();
      
      if (!testResults.salesforceAccess) {
        setLoading(false);
        return;
      }
      
      // Safely access the client to avoid build issues
      const client = testResults.usingAdminClient && supabase.hasAdminAccess() 
        ? supabase.admin 
        : supabase.regular;
      
      // Try to query leads using RPC first
      try {
        const { data, error } = await client.rpc('query_salesforce_table', {
          table_name: 'lead',
          limit_count: 1000 // Get more leads for statistics
        });
        
        if (error || !Array.isArray(data)) {
          throw new Error(error?.message || 'Invalid data format received');
        }
        
        // Process data
        processLeadsData(data);
        
      } catch (rpcError) {
        // If RPC fails and we're using admin client, try direct SQL
        if (testResults.usingAdminClient) {
          try {
            // First try fivetran_views schema
            // Ensure admin client is available
            if (!supabase.hasAdminAccess()) {
              throw new Error('Admin client not available for SQL query');
            }
            
            const { data: fivetranData, error: fivetranError } = await supabase.admin.rpc('execute_sql_query', {
              query_text: 'SELECT * FROM fivetran_views.lead LIMIT 1000',
              query_params: []
            });
            
            if (!fivetranError && Array.isArray(fivetranData)) {
              logger.info('Successfully loaded stats from fivetran_views schema');
              
              // Process data
              processLeadsData(fivetranData);
              return;
            }
            
            // If fivetran_views fails, try public schema
            logger.warn('Failed to load stats from fivetran_views, trying public schema');
            
            // Admin access was checked above, but checking again to be safe
            if (!supabase.hasAdminAccess()) {
              throw new Error('Admin client not available for SQL query');
            }
            
            const { data: publicData, error: publicError } = await supabase.admin.rpc('execute_sql_query', {
              query_text: 'SELECT * FROM public.lead LIMIT 1000',
              query_params: []
            });
            
            if (publicError || !Array.isArray(publicData)) {
              throw new Error(publicError?.message || 'Invalid data format received');
            }
            
            logger.info('Successfully loaded stats from public schema');
            // Process data
            processLeadsData(publicData);
            
          } catch (sqlError) {
            logger.error('All query methods failed for stats:', sqlError);
            throw sqlError;
          }
        } else {
          // Not using admin client, propagate original error
          throw rpcError;
        }
      }
    } catch (error) {
      logger.error('Error loading stats:', error);
      // Set default empty stats
      setStats({
        totalLeads: 0,
        openLeads: 0,
        convertedLeads: 0,
        byCampus: {},
        bySource: {}
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Helper function to process lead data and update stats
  const processLeadsData = (data: any[]) => {
    if (!Array.isArray(data)) {
      console.error('Invalid data format received in processLeadsData');
      return;
    }
    
    const totalLeads = data.length;
    const openLeads = data.filter(lead => lead.status === 'Open').length;
    const convertedLeads = data.filter(lead => lead.status === 'Converted').length;
    
    // Group by campus
    const byCampus = data.reduce((acc: Record<string, number>, lead) => {
      const campus = lead.campus || 'Unknown';
      acc[campus] = (acc[campus] || 0) + 1;
      return acc;
    }, {});
    
    // Group by source
    const bySource = data.reduce((acc: Record<string, number>, lead) => {
      const source = lead.source || 'Unknown';
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});
    
    setStats({
      totalLeads,
      openLeads,
      convertedLeads,
      byCampus,
      bySource
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-gradient-to-r from-slate-700 to-slate-600 text-white py-8 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-2xl md:text-3xl font-semibold">Salesforce Analytics</h1>
            <Navbar />
          </div>
          <p className="text-white/80 mt-2">
            View and analyze Salesforce data across all campuses
          </p>
        </div>
      </header>
      
      <main className="container mx-auto max-w-6xl p-4">
        <div className="mb-6">
          <DatabaseConnectionAlert />
        </div>
        
        <div className="mb-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <CardTitle>Salesforce Leads Dashboard</CardTitle>
                <div className="w-full md:w-64">
                  <Select
                    value={selectedCampus}
                    onValueChange={setSelectedCampus}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Campus" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMPUSES.map((campus) => (
                        <SelectItem key={campus.id} value={campus.id}>
                          {campus.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {selectedCampus === 'all' 
                  ? 'Showing data for all campuses' 
                  : `Showing data for ${CAMPUSES.find(c => c.id === selectedCampus)?.name}`}
              </p>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
                <TabsList className="mb-4">
                  <TabsTrigger value="table">Data Table</TabsTrigger>
                  <TabsTrigger value="stats">Statistics</TabsTrigger>
                  <TabsTrigger value="test">Connection Test</TabsTrigger>
                  <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
                </TabsList>
                
                <TabsContent value="table">
                  <LeadsDataTable selectedCampus={selectedCampus} />
                </TabsContent>
                
                <TabsContent value="stats">
                  <LeadsStats stats={stats} isLoading={loading} />
                </TabsContent>
                
                <TabsContent value="test" className="space-y-6">
                  <SupabaseConnectionTest />
                  <SalesforceConnectionTest />
                </TabsContent>
                
                <TabsContent value="diagnostics" className="space-y-4">
                  <SimpleDatabaseTest />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SalesforceLeadsPage;
