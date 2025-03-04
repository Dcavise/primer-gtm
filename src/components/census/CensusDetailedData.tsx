
import { Users, TrendingUp, Home, GraduationCap } from "lucide-react";
import { CensusData } from "@/hooks/use-census-data";
import { CensusDataCategory } from "./CensusDataCategory";

interface CensusDetailedDataProps {
  censusData: CensusData;
}

export const CensusDetailedData = ({ censusData }: CensusDetailedDataProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      <CensusDataCategory
        title="Demographics" 
        description="Population characteristics"
        items={censusData.categories.demographic}
        icon={Users}
        iconColor="text-blue-500"
        delay={0.5}
      />
      
      <CensusDataCategory
        title="Economic" 
        description="Income and employment data"
        items={censusData.categories.economic}
        icon={TrendingUp}
        iconColor="text-green-500"
        delay={0.6}
      />
      
      <CensusDataCategory
        title="Housing" 
        description="Housing characteristics"
        items={censusData.categories.housing}
        icon={Home}
        iconColor="text-orange-500"
        delay={0.7}
      />
      
      <CensusDataCategory
        title="Education" 
        description="Educational attainment"
        items={censusData.categories.education}
        icon={GraduationCap}
        iconColor="text-purple-500"
        delay={0.8}
      />
    </div>
  );
};
