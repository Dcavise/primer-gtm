import { useState } from "react";
import { School } from "@/types/schools";
import { SchoolCard } from "./SchoolCard";
import { LoadingState } from "./LoadingState";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, GraduationCap, School as SchoolIcon, ArrowUpDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface SchoolsListProps {
  schools: School[];
  isLoading: boolean;
  searchedAddress: string;
  radiusMiles?: number;
}

export const SchoolsList = ({ schools, isLoading, searchedAddress, radiusMiles = 5 }: SchoolsListProps) => {
  const [activeLevel, setActiveLevel] = useState("All");
  const [sortBy, setSortBy] = useState<"distance" | "rating">("distance");

  const getLevelIcon = (level: string) => {
    const type = level.toLowerCase();
    
    if (type === "all") {
      return <SchoolIcon className="h-4 w-4" />;
    } else if (type.includes("elementary")) {
      return <Building className="h-4 w-4" />;
    } else if (type.includes("high") || type.includes("middle")) {
      return <GraduationCap className="h-4 w-4" />;
    } else {
      return <SchoolIcon className="h-4 w-4" />;
    }
  };

  const categorizeSchoolsByLevel = (schools: School[]) => {
    const levels: Record<string, School[]> = {
      "All": schools,
    };
    
    const uniqueLevels = new Set<string>();
    schools.forEach(school => {
      if (school.educationLevel) {
        uniqueLevels.add(school.educationLevel);
      }
    });
    
    uniqueLevels.forEach(level => {
      levels[level] = schools.filter(school => school.educationLevel === level);
    });
    
    return levels;
  };

  const sortSchools = (schools: School[]) => {
    return [...schools].sort((a, b) => {
      if (sortBy === "distance") {
        const distanceA = a.location?.distanceMiles || 0;
        const distanceB = b.location?.distanceMiles || 0;
        return distanceA - distanceB;
      } else {
        const ratingA = a.ratings?.overall || 0;
        const ratingB = b.ratings?.overall || 0;
        return ratingB - ratingA; // Higher ratings first
      }
    });
  };

  const schoolsByLevel = categorizeSchoolsByLevel(schools);
  
  const activeSchools = sortSchools(schoolsByLevel[activeLevel] || []);

  const getLevelCount = (level: string) => {
    return schoolsByLevel[level]?.length || 0;
  };

  const sortedLevels = Object.keys(schoolsByLevel).sort((a, b) => {
    if (a === "All") return -1; // All should always be first
    if (b === "All") return 1;
    if (a.toLowerCase().includes("elementary")) return -1; // Elementary comes next
    if (b.toLowerCase().includes("elementary")) return 1;
    if (a.toLowerCase().includes("middle") && !b.toLowerCase().includes("high")) return -1; // Middle comes before High
    if (b.toLowerCase().includes("middle") && !a.toLowerCase().includes("high")) return 1;
    return a.localeCompare(b); // Alphabetical for the rest
  });

  const toggleSortBy = () => {
    setSortBy(prev => prev === "distance" ? "rating" : "distance");
  };

  if (isLoading) {
    return <LoadingState className="mt-6" />;
  }

  if (schools.length === 0 && searchedAddress) {
    return (
      <div className="py-6 text-center">
        <h3 className="text-xl font-medium mb-2">No schools found</h3>
        <p className="text-muted-foreground">
          We couldn't find any schools within {radiusMiles} miles of this location. Try a different address or expand your search criteria.
        </p>
      </div>
    );
  }

  if (!searchedAddress) {
    return null;
  }

  return (
    <>
      {searchedAddress && schools.length > 0 && (
        <Alert className="mb-6 bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/30">
          <div className="flex items-start">
            <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="ml-3">
              <AlertTitle className="text-blue-800 dark:text-blue-300">
                Found {schools.length} schools near your location
              </AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-400">
                Showing schools within a {radiusMiles}-mile radius of "{searchedAddress}".
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      {schools.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                {schools.length}
              </Badge>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleSortBy}
              className="flex items-center gap-1"
            >
              <ArrowUpDown className="h-4 w-4" />
              Sort by: {sortBy === "distance" ? "Distance" : "Rating"}
            </Button>
          </div>
          
          <Tabs 
            defaultValue="All" 
            className="mt-2"
            value={activeLevel}
            onValueChange={setActiveLevel}
          >
            <div className="border-b">
              <TabsList className="bg-transparent h-auto p-0 mb-0 w-full overflow-x-auto flex justify-start gap-1">
                {sortedLevels.map(level => (
                  getLevelCount(level) > 0 && (
                    <TabsTrigger 
                      key={level} 
                      value={level}
                      className="flex items-center gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-10 px-4"
                    >
                      {getLevelIcon(level)}
                      {level}
                      <span className="ml-1 bg-secondary/50 px-1.5 rounded-full text-xs">
                        {getLevelCount(level)}
                      </span>
                    </TabsTrigger>
                  )
                ))}
              </TabsList>
            </div>

            {sortedLevels.map(level => (
              <TabsContent key={level} value={level} className="mt-4 animate-in fade-in-50">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeSchools.map((school, index) => (
                    <SchoolCard
                      key={school.id || index}
                      school={school}
                      delay={index}
                    />
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </>
  );
};
