
import { motion } from "framer-motion";

interface CensusEmptyStateProps {
  searchedAddress: string;
}

export const CensusEmptyState = ({ searchedAddress }: CensusEmptyStateProps) => {
  if (searchedAddress) {
    return (
      <div className="py-8 text-center">
        <h2 className="text-xl font-medium mb-2">No census data available</h2>
        <p className="text-muted-foreground">
          We couldn't retrieve census data for this location. Please try a different address or check that you've entered a valid US address.
        </p>
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
