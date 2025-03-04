
import { CensusData } from "@/hooks/use-census-data";
import { LoadingState } from "@/components/LoadingState";
import { CensusHeader } from "./census/CensusHeader";
import { CensusEmptyState } from "./census/CensusEmptyState";
import { CensusOverviewStats } from "./census/CensusOverviewStats";
import { CensusDetailedData } from "./census/CensusDetailedData";

interface CensusListProps {
  censusData: CensusData | null;
  isLoading: boolean;
  searchedAddress: string;
}

export const CensusList = ({ censusData, isLoading, searchedAddress }: CensusListProps) => {
  if (isLoading) {
    return <LoadingState message="Retrieving census data..." />;
  }

  if (!censusData && !isLoading) {
    return <CensusEmptyState searchedAddress={searchedAddress} />;
  }

  if (!censusData) {
    return null;
  }

  return (
    <div className="py-6 space-y-6">
      <CensusHeader searchedAddress={searchedAddress} />
      <CensusOverviewStats censusData={censusData} />
      <CensusDetailedData censusData={censusData} />
    </div>
  );
};
