
import { Users, TrendingUp, Home, GraduationCap } from "lucide-react";
import { CensusData } from "@/hooks/use-census-data";
import { CensusStatCard } from "./CensusStatCard";
import { formatNumber, formatPercent } from "@/utils/format";

interface CensusOverviewStatsProps {
  censusData: CensusData;
}

export const CensusOverviewStats = ({ censusData }: CensusOverviewStatsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <CensusStatCard
        title="Population"
        value={censusData?.totalPopulation ? formatNumber(censusData.totalPopulation) : 'N/A'}
        description="Total population in census tract"
        icon={Users}
        iconColor="text-blue-500"
        delay={0.1}
      />
      
      <CensusStatCard
        title="Median Income"
        value={censusData?.medianHouseholdIncome ? `$${formatNumber(censusData.medianHouseholdIncome)}` : 'N/A'}
        description="Median household income"
        icon={TrendingUp}
        iconColor="text-green-500"
        delay={0.2}
      />
      
      <CensusStatCard
        title="Home Value"
        value={censusData?.medianHomeValue ? `$${formatNumber(censusData.medianHomeValue)}` : 'N/A'}
        description="Median home value"
        icon={Home}
        iconColor="text-orange-500"
        delay={0.3}
      />
      
      <CensusStatCard
        title="Education"
        value={censusData?.educationLevelBachelor ? `${formatPercent(censusData.educationLevelBachelor)}%` : 'N/A'}
        description="Bachelor's degree or higher"
        icon={GraduationCap}
        iconColor="text-purple-500"
        delay={0.4}
      />
    </div>
  );
};
