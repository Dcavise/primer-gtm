
import { useState, useMemo } from "react";
import { Permit } from "@/types";
import { PermitCard } from "./PermitCard";
import { PermitDetail } from "./PermitDetail";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LoadingState } from "./LoadingState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, FileText, Wrench, CreditCard, Map, Globe, CheckCircle } from "lucide-react";

interface PermitListProps {
  permits: Permit[];
  isLoading: boolean;
  searchedAddress: string;
}

// Helper function to get icon based on category
const getCategoryIcon = (category: string) => {
  switch (category) {
    case "Building":
      return <Building className="h-4 w-4" />;
    case "Construction":
      return <Wrench className="h-4 w-4" />;
    case "Zoning":
      return <Map className="h-4 w-4" />;
    case "Business":
      return <CreditCard className="h-4 w-4" />;
    case "Other":
      return <FileText className="h-4 w-4" />;
    case "All":
      return <CheckCircle className="h-4 w-4" />;
    default:
      return <Globe className="h-4 w-4" />;
  }
};

export const PermitList = ({ permits, isLoading, searchedAddress }: PermitListProps) => {
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");

  const handlePermitClick = (permit: Permit) => {
    setSelectedPermit(permit);
    setIsDetailOpen(true);
  };

  // Function to categorize permits
  const categorizePermits = (permits: Permit[]) => {
    const categories: Record<string, Permit[]> = {
      "All": [],
      "Building": [],
      "Construction": [],
      "Zoning": [],
      "Business": [],
      "Other": [],
    };

    // Add all permits to the All category
    categories["All"] = permits;

    // Categorize each permit
    permits.forEach(permit => {
      const projectType = permit.project_type?.toLowerCase() || "";
      
      if (projectType.includes("build") || projectType.includes("renovation") || projectType.includes("remodel")) {
        categories["Building"].push(permit);
      } else if (projectType.includes("construct") || projectType.includes("install") || projectType.includes("repair")) {
        categories["Construction"].push(permit);
      } else if (projectType.includes("zone") || projectType.includes("land") || projectType.includes("plan")) {
        categories["Zoning"].push(permit);
      } else if (projectType.includes("business") || projectType.includes("license") || projectType.includes("commercial")) {
        categories["Business"].push(permit);
      } else {
        categories["Other"].push(permit);
      }
    });

    return categories;
  };

  // Memoize the categorized permits to avoid recalculation on each render
  const categorizedPermits = useMemo(() => categorizePermits(permits), [permits]);
  
  // Get active permits based on selected category
  const activePermits = categorizedPermits[activeCategory] || [];

  // Count permits in each category
  const getCategoryCount = (category: string) => {
    return categorizedPermits[category]?.length || 0;
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
      {permits.length > 0 && (
        <Tabs 
          defaultValue="All" 
          className="mt-6"
          value={activeCategory}
          onValueChange={setActiveCategory}
        >
          <div className="border-b">
            <TabsList className="bg-transparent h-auto p-0 mb-0 w-full overflow-x-auto flex justify-start gap-1">
              {Object.keys(categorizedPermits).map(category => (
                getCategoryCount(category) > 0 && (
                  <TabsTrigger 
                    key={category} 
                    value={category}
                    className="flex items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-10 px-4"
                  >
                    {getCategoryIcon(category)}
                    {category}
                    <span className="ml-1 bg-secondary/50 px-1.5 rounded-full text-xs">
                      {getCategoryCount(category)}
                    </span>
                  </TabsTrigger>
                )
              ))}
            </TabsList>
          </div>

          {Object.keys(categorizedPermits).map(category => (
            <TabsContent key={category} value={category} className="mt-4 animate-in fade-in-50">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activePermits.map((permit, index) => (
                  <PermitCard
                    key={permit.id || index}
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

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl mx-auto">
          {selectedPermit && <PermitDetail permit={selectedPermit} />}
        </DialogContent>
      </Dialog>
    </>
  );
};
