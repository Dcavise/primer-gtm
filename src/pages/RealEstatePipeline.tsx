
import React, { useState, useEffect } from "react";
import { RealEstatePipelineSync } from "@/components/RealEstatePipelineSync";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { StatsCard } from "@/components/salesforce/StatsCard";
import { CheckCircle, Clock, MapPin, Building, Activity } from "lucide-react";

// Define the Real Estate Pipeline data type
interface RealEstatePipelineItem {
  id: string;
  phase: string;
  state: string;
  market: string;
  site_name_type: string;
  address: string;
  status: string;
  ll_poc: string;
  zoning: string;
  [key: string]: any; // For other properties
}

const RealEstatePipelinePage: React.FC = () => {
  const [pipelineData, setPipelineData] = useState<RealEstatePipelineItem[]>([]);
  const [filteredData, setFilteredData] = useState<RealEstatePipelineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [stats, setStats] = useState({
    totalProperties: 0,
    activePhases: 0,
    statesCount: 0,
    marketsCount: 0
  });

  // Fetch pipeline data
  const fetchPipelineData = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("real_estate_pipeline")
        .select("*")
        .order("phase", { ascending: true });

      if (error) {
        throw error;
      }

      setPipelineData(data || []);
      setFilteredData(data || []);
      
      // Calculate stats
      if (data) {
        const uniquePhases = new Set(data.map(item => item.phase).filter(Boolean));
        const uniqueStates = new Set(data.map(item => item.state).filter(Boolean));
        const uniqueMarkets = new Set(data.map(item => item.market).filter(Boolean));
        
        setStats({
          totalProperties: data.length,
          activePhases: uniquePhases.size,
          statesCount: uniqueStates.size,
          marketsCount: uniqueMarkets.size
        });
      }
    } catch (error) {
      console.error("Error fetching pipeline data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPipelineData();
  }, []);

  // Handle search
  useEffect(() => {
    if (searchTerm) {
      const filtered = pipelineData.filter(item => 
        (item.site_name_type && item.site_name_type.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.address && item.address.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.market && item.market.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.state && item.state.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.phase && item.phase.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredData(filtered);
    } else {
      setFilteredData(pipelineData);
    }
  }, [searchTerm, pipelineData]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Real Estate Pipeline</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Properties"
          value={stats.totalProperties}
          icon={Building}
        />
        <StatsCard
          title="Active Phases"
          value={stats.activePhases}
          icon={Activity}
        />
        <StatsCard
          title="States"
          value={stats.statesCount}
          icon={MapPin}
        />
        <StatsCard
          title="Markets"
          value={stats.marketsCount}
          icon={CheckCircle}
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="md:col-span-3">
          <Card className="w-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-xl">Search Properties</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                type="text"
                placeholder="Search by property name, address, market, state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-1">
          <RealEstatePipelineSync />
        </div>
      </div>

      <Card className="w-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Property Listings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Phase</TableHead>
                    <TableHead>Site Name/Type</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Market</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>LL POC</TableHead>
                    <TableHead>Zoning</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.length > 0 ? (
                    filteredData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.phase || "-"}</TableCell>
                        <TableCell>{item.site_name_type || "-"}</TableCell>
                        <TableCell>{item.address || "-"}</TableCell>
                        <TableCell>{item.market || "-"}</TableCell>
                        <TableCell>{item.state || "-"}</TableCell>
                        <TableCell>{item.status || "-"}</TableCell>
                        <TableCell>{item.ll_poc || "-"}</TableCell>
                        <TableCell>{item.zoning || "-"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        No properties found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RealEstatePipelinePage;
