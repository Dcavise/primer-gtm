
import { motion } from "framer-motion";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface CensusEmptyStateProps {
  searchedAddress: string;
}

export const CensusEmptyState = ({ searchedAddress }: CensusEmptyStateProps) => {
  if (searchedAddress) {
    return (
      <div className="py-8 space-y-4">
        <Alert variant="destructive" className="max-w-xl mx-auto">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>No census data available</AlertTitle>
          <AlertDescription>
            We couldn't retrieve census data for this location.
          </AlertDescription>
        </Alert>
        
        <div className="text-center space-y-3 max-w-xl mx-auto">
          <p className="text-muted-foreground">
            This could happen for several reasons:
          </p>
          <ul className="text-sm text-muted-foreground text-left list-disc px-6">
            <li>The address is outside the United States (Census data is US-only)</li>
            <li>The Census API service is temporarily unavailable</li>
            <li>The address doesn't match any census geographic boundaries</li>
          </ul>
          <p className="text-sm pt-2">
            Please try a different US address or try again later.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <motion.div 
      className="py-16 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3, duration: 0.6 }}
    >
      <h2 className="text-2xl font-medium mb-3">Enter an address to get started</h2>
      <p className="text-muted-foreground max-w-2xl mx-auto">
        Explore detailed demographic data from the U.S. Census Bureau for your property's location. 
        This information helps you understand:
      </p>
      <ul className="mt-4 text-muted-foreground max-w-lg mx-auto text-left list-disc pl-8">
        <li className="mb-2">Population demographics and household composition</li>
        <li className="mb-2">Income levels and economic indicators</li>
        <li className="mb-2">Housing market characteristics</li>
        <li className="mb-2">Education levels and workforce statistics</li>
        <li className="mb-2">Community profile attributes relevant to property investment</li>
      </ul>
    </motion.div>
  );
};
