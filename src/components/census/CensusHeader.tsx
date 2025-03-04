
import { motion } from "framer-motion";

interface CensusHeaderProps {
  searchedAddress: string;
}

export const CensusHeader = ({ searchedAddress }: CensusHeaderProps) => {
  if (!searchedAddress) return null;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="mb-6"
    >
      <h2 className="text-lg md:text-xl font-medium mb-1">Census data for</h2>
      <p className="text-muted-foreground">{searchedAddress}</p>
    </motion.div>
  );
};
