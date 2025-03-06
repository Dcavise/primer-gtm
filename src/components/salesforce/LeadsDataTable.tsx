import React, { useState, useEffect } from 'react';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { supabaseAdmin } from '@/integrations/supabase/admin-client';
import { testSalesforceConnection } from '@/utils/test-salesforce';
import { toast } from '@/hooks/use-toast';

interface Lead {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: string;
  campus?: string;
  created_date?: string;
  source?: string;
  [key: string]: any; // For any additional fields
}

interface LeadsDataTableProps {
  selectedCampus: string;
}

export const LeadsDataTable: React.FC<LeadsDataTableProps> = ({ selectedCampus }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [usingAdminClient, setUsingAdminClient] = useState(false);
  
  const itemsPerPage = 10;
  
  useEffect(() => {
    fetchLeads();
  }, [selectedCampus]);
  
  useEffect(() => {
    // Filter leads when search term or campus selection changes
    if (!leads.length) return;
    
    let filtered = [...leads];
    
    // Filter by campus if not "all"
    if (selectedCampus !== 'all') {
      filtered = filtered.filter(lead => 
        lead.campus?.toLowerCase() === selectedCampus.toLowerCase()
      );
    }
    
    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(lead => 
        lead.name?.toLowerCase().includes(term) ||
        lead.email?.toLowerCase().includes(term) ||
        lead.company?.toLowerCase().includes(term) ||
        lead.status?.toLowerCase().includes(term)
      );
    }
    
    setFilteredLeads(filtered);
    setTotalPages(Math.max(1, Math.ceil(filtered.length / itemsPerPage)));
    setCurrentPage(1); // Reset to first page on filter change
  }, [leads, searchTerm, selectedCampus]);
  
  const fetchLeads = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First test connection to determine which client to use
      const testResults = await testSalesforceConnection();
      
      if (!testResults.salesforceAccess) {
        setError('No access to Salesforce schema');
        setLoading(false);
        toast({
          title: "Connection Error",
          description: "Could not access Salesforce data",
          variant: "destructive"
        });
        return;
      }
      
      setUsingAdminClient(testResults.usingAdminClient);
      const client = testResults.usingAdminClient ? supabaseAdmin : supabase;
      
      // Query leads from Salesforce
      const { data, error } = await client.rpc('query_salesforce_table', {
        table_name: 'lead',
        limit_count: 100 // Get more leads for client-side filtering
      });
      
      if (error) {
        console.error('Error fetching leads:', error);
        setError(`Error fetching leads: ${error.message}`);
        setLoading(false);
        toast({
          title: "Data Error",
          description: "Could not fetch leads data",
          variant: "destructive"
        });
        return;
      }
      
      if (Array.isArray(data)) {
        setLeads(data);
        setFilteredLeads(data);
        setTotalPages(Math.max(1, Math.ceil(data.length / itemsPerPage)));
        
        toast({
          title: "Data Loaded",
          description: `Successfully loaded ${data.length} leads`,
          variant: "default"
        });
      } else {
        setLeads([]);
        setFilteredLeads([]);
        setTotalPages(1);
        setError('No leads data returned');
      }
    } catch (error) {
      console.error('Error in fetchLeads:', error);
      setError(`Error fetching leads: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: "Error",
        description: "Failed to fetch leads data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLeads.slice(startIndex, startIndex + itemsPerPage);
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between space-y-2 md:space-y-0 md:space-x-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <Button 
          onClick={fetchLeads} 
          variant="outline" 
          disabled={loading}
          className="flex-none"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Campus</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading data...
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-red-500">
                  {error}
                </TableCell>
              </TableRow>
            ) : filteredLeads.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No leads found.
                </TableCell>
              </TableRow>
            ) : (
              getPaginatedData().map((lead) => (
                <TableRow key={lead.id}>
                  <TableCell className="font-medium">{lead.name || 'N/A'}</TableCell>
                  <TableCell>{lead.email || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={lead.status === 'Open' ? 'default' : 'secondary'}>
                      {lead.status || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>{lead.campus || 'N/A'}</TableCell>
                  <TableCell>
                    {lead.created_date 
                      ? new Date(lead.created_date).toLocaleDateString()
                      : 'N/A'
                    }
                  </TableCell>
                  <TableCell>{lead.source || 'N/A'}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      {!loading && !error && filteredLeads.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {Math.min(filteredLeads.length, (currentPage - 1) * itemsPerPage + 1)}-
            {Math.min(filteredLeads.length, currentPage * itemsPerPage)} of {filteredLeads.length} leads
          </div>
          
          <Pagination>
            <PaginationContent>
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
                </PaginationItem>
              )}
              
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                // Show pages around current page
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                }
                if (pageNum > totalPages) return null;
                
                return (
                  <PaginationItem key={pageNum}>
                    <PaginationLink
                      isActive={currentPage === pageNum}
                      onClick={() => handlePageChange(pageNum)}
                    >
                      {pageNum}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              
              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}; 