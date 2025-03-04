import { useState, useMemo } from "react";
import { Permit } from "@/types";
import { PermitCard } from "./PermitCard";
import { PermitDetail } from "./PermitDetail";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LoadingState } from "./LoadingState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, FileText, Wrench, CreditCard, Map, CheckCircle, MapPin, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/format";

interface PermitListProps {
  permits: Permit[];
  isLoading: boolean;
  searchedAddress: string;
}

// Helper function to get icon based on permit type
const getPermitTypeIcon = (permitType: string) => {
  const type = permitType.toLowerCase();
  
  if (type.includes("build") || type.includes("renovation") || type.includes("remodel")) {
    return <Building className="h-4 w-4" />;
  } else if (type.includes("construct") || type.includes("install") || type.includes("repair")) {
    return <Wrench className="h-4 w-4" />;
  } else if (type.includes("zone") || type.includes("land") || type.includes("plan")) {
    return <Map className="h-4 w-4" />;
  } else if (type.includes("business") || type.includes("license") || type.includes("commercial")) {
    return <CreditCard className="h-4 w-4" />;
  } else if (type.includes("all")) {
    return <CheckCircle className="h-4 w-4" />;
  } else {
    return <FileText className="h-4 w-4" />;
  }
};

export const PermitList = ({ permits, isLoading, searchedAddress }: PermitListProps) => {
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeType, setActiveType] = useState("All");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const handlePermitClick = (permit: Permit) => {
    setSelectedPermit(permit);
    setIsDetailOpen(true);
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === "asc" ? "desc" : "asc");
  };

  // Function to check if the permit address is an exact match to the searched address
  const isExactMatch = (permit: Permit) => {
    if (!searchedAddress || !permit.address) return false;
    
    const normalizedPermitAddress = permit.address.toLowerCase().trim();
    const normalizedSearchAddress = searchedAddress.toLowerCase().trim();
    
    return normalizedPermitAddress === normalizedSearchAddress;
  };

  // Split permits into exact matches and other matches
  const { exactMatches, otherPermits } = useMemo(() => {
    const exact: Permit[] = [];
    const others: Permit[] = [];
    
    permits.forEach(permit => {
      if (isExactMatch(permit)) {
        exact.push(permit);
      } else {
        others.push(permit);
      }
    });
    
    return { exactMatches: exact, otherPermits: others };
  }, [permits, searchedAddress]);

  // Function to organize permits by their project_type
  const categorizePermitsByType = (permits: Permit[]) => {
    const types: Record<string, Permit[]> = {
      "All": permits,
    };
    
    const uniqueTypes = new Set<string>();
    permits.forEach(permit => {
      if (permit.project_type) {
        uniqueTypes.add(permit.project_type);
      }
    });
    
    uniqueTypes.forEach(type => {
      types[type] = permits.filter(permit => permit.project_type === type);
    });
    
    return types;
  };

  // Apply sorting to permits
  const sortPermits = (permits: Permit[]) => {
    return [...permits].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    });
  };

  // Memoize the categorized permits to avoid recalculation on each render
  const permitsByType = useMemo(() => categorizePermitsByType(otherPermits), [otherPermits]);
  
  // Get active permits based on selected type, with sorting applied
  const activePermits = useMemo(() => 
    sortPermits(permitsByType[activeType] || []), 
    [permitsByType, activeType, sortDirection]
  );

  // Apply sorting to exact matches as well
  const sortedExactMatches = useMemo(() => 
    sortPermits(exactMatches), 
    [exactMatches, sortDirection]
  );

  // Count permits in each type
  const getTypeCount = (type: string) => {
    return permitsByType[type]?.length || 0;
  };

  if (isLoading) {
    return <LoadingState className="mt-6" />;
  }

  if (permits.length === 0 && searchedAddress) {
    return (
      <div className="py-12 text-center">
        <h3 className="text-xl font-medium mb-2">No permits found</h3>
        <p className="text-muted-foreground">
          We couldn't find any permit data for this location. Try adjusting your search or try a different address.
        </p>
      </div>
    );
  }

  return (
    <>
      {exactMatches.length > 0 && (
        <div className="mt-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-500" />
              <h2 className="text-xl font-medium">Exact Address Matches</h2>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {exactMatches.length}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleSortDirection}
              className="flex items-center gap-1"
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortDirection === "desc" ? "Newest first" : "Oldest first"}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedExactMatches.map((permit, index) => (
              <PermitCard
                key={`exact-${permit.id || index}`}
                permit={permit}
                onClick={() => handlePermitClick(permit)}
                delay={index}
                searchedAddress={searchedAddress}
              />
            ))}
          </div>
        </div>
      )}

      {otherPermits.length > 0 && (
        <div className={exactMatches.length > 0 ? "mt-10" : "mt-6"}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Map className="h-5 w-5 text-blue-500" />
              <h2 className="text-xl font-medium">Nearby Permits</h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                {otherPermits.length}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleSortDirection}
              className="flex items-center gap-1"
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortDirection === "desc" ? "Newest first" : "Oldest first"}
            </Button>
          </div>
          
          <Tabs 
            defaultValue="All" 
            className="mt-2"
            value={activeType}
            onValueChange={setActiveType}
          >
            <div className="border-b">
              <TabsList className="bg-transparent h-auto p-0 mb-0 w-full overflow-x-auto flex justify-start gap-1">
                {Object.keys(permitsByType).map(type => (
                  getTypeCount(type) > 0 && (
                    <TabsTrigger 
                      key={type} 
                      value={type}
                      className="flex items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-10 px-4"
                    >
                      {getPermitTypeIcon(type)}
                      {type}
                      <span className="ml-1 bg-secondary/50 px-1.5 rounded-full text-xs">
                        {getTypeCount(type)}
                      </span>
                    </TabsTrigger>
                  )
                ))}
              </TabsList>
            </div>

            {Object.keys(permitsByType).map(type => (
              <TabsContent key={type} value={type} className="mt-4 animate-in fade-in-50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activePermits.map((permit, index) => (
                    <PermitCard
                      key={`nearby-${permit.id || index}`}
                      permit={permit}
                      onClick={() => handlePermitClick(permit)}
                      delay={index}
                      searchedAddress={searchedAddress}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl mx-auto">
          <DialogTitle>Permit Details</DialogTitle>
          {selectedPermit && <PermitDetail permit={selectedPermit} />}
        </DialogContent>
      </Dialog>
    </>
  );
};
