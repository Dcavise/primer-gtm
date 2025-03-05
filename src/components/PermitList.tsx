
import { useState, useMemo } from "react";
import { Permit } from "@/types";
import { PermitCard } from "./PermitCard";
import { PermitDetail } from "./PermitDetail";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { LoadingState } from "./LoadingState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, FileText, Wrench, CreditCard, Map, CheckCircle, MapPin, ArrowUpDown, AlertCircle, InfoIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/utils/format";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface PermitListProps {
  permits: Permit[];
  isLoading: boolean;
  searchedAddress: string;
  isUsingFallbackData?: boolean;
}

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

export const PermitList = ({ permits, isLoading, searchedAddress, isUsingFallbackData = false }: PermitListProps) => {
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

  const sortPermits = (permits: Permit[]) => {
    return [...permits].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      
      return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
    });
  };

  const permitsByType = useMemo(() => categorizePermitsByType(permits), [permits]);
  
  const activePermits = useMemo(() => 
    sortPermits(permitsByType[activeType] || []), 
    [permitsByType, activeType, sortDirection]
  );

  const getTypeCount = (type: string) => {
    return permitsByType[type]?.length || 0;
  };

  if (isLoading) {
    return <LoadingState className="mt-6" />;
  }

  if (permits.length === 0 && searchedAddress) {
    return (
      <div className="py-6 text-center">
        <h3 className="text-xl font-medium mb-2">No permits found</h3>
        <p className="text-muted-foreground">
          We couldn't find any permit data for this exact address. This could be because:
        </p>
        <ul className="mt-4 text-left max-w-md mx-auto list-disc pl-6">
          <li className="mb-2">The address has no permit history in our database</li>
          <li className="mb-2">The address format may be different in the permit database</li>
          <li className="mb-2">The property may be newer than our permit records</li>
        </ul>
      </div>
    );
  }

  if (!searchedAddress) {
    return null;
  }

  return (
    <>
      {isUsingFallbackData && (
        <Alert 
          className="mb-6 bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-900/30"
        >
          <div className="flex items-start">
            <InfoIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div className="ml-3">
              <AlertTitle className="text-amber-800 dark:text-amber-300">
                Using sample permit data
              </AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-400">
                We're currently unable to connect to the permit database. Showing sample data instead.
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {searchedAddress && permits.length > 0 && !isUsingFallbackData && (
        <Alert 
          className="mb-6 bg-green-50 border-green-200 dark:bg-green-900/10 dark:border-green-900/30"
        >
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div className="ml-3">
              <AlertTitle className="text-green-800 dark:text-green-300">
                {`${permits.length} permit${permits.length > 1 ? 's' : ''} found`}
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-400">
                {`Found ${permits.length} permit record${permits.length > 1 ? 's' : ''} that match the address "${searchedAddress}".`}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {permits.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge variant={isUsingFallbackData ? "outline" : "default"} className={isUsingFallbackData ? "border-amber-300 text-amber-700" : "bg-green-100 text-green-800"}>
                {permits.length}
              </Badge>
              {isUsingFallbackData && (
                <span className="text-amber-600 text-xs font-medium flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Sample data
                </span>
              )}
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

          {permits.length > 0 && (
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
                        key={`permit-${permit.id || index}`}
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
          )}
        </div>
      )}

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl mx-auto max-h-[85vh] overflow-y-auto">
          <DialogTitle>Permit Details</DialogTitle>
          {selectedPermit && <PermitDetail permit={selectedPermit} />}
        </DialogContent>
      </Dialog>
    </>
  );
};
