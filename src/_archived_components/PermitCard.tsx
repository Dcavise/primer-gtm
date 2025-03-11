import { Permit } from "@/types";
import { formatDate } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion } from "framer-motion";
import { MapPin, CheckCircle, Calendar } from "lucide-react";

interface PermitCardProps {
  permit: Permit;
  onClick: () => void;
  delay?: number;
  searchedAddress: string;
}

export const PermitCard = ({ permit, onClick, delay = 0, searchedAddress }: PermitCardProps) => {
  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("approved") || lowerStatus.includes("complete")) return "bg-green-500";
    if (lowerStatus.includes("pending") || lowerStatus.includes("review")) return "bg-amber-500";
    if (lowerStatus.includes("denied") || lowerStatus.includes("reject")) return "bg-red-500";
    return "bg-blue-500";
  };

  // Function to check if the permit address is an exact match to the searched address
  const isExactMatch = () => {
    if (!searchedAddress) return false;

    // Normalize both addresses (remove extra spaces, make lowercase)
    const normalizedPermitAddress = permit.address?.toLowerCase().trim();
    const normalizedSearchAddress = searchedAddress.toLowerCase().trim();

    return normalizedPermitAddress === normalizedSearchAddress;
  };

  const exactMatch = isExactMatch();

  // Use project_brief as description, fallback to project_name, then project_type
  const description =
    permit.project_brief || permit.project_name || permit.project_type || "Unknown Project";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <Card
        className={`overflow-hidden border transition-all cursor-pointer group backdrop-blur-sm ${
          exactMatch
            ? "border-green-500 bg-green-50 dark:bg-green-900/10"
            : "border-border/40 hover:border-border/80 bg-card/80"
        }`}
        onClick={onClick}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="line-clamp-2 text-lg md:text-xl group-hover:text-primary transition-colors">
                {description}
                {exactMatch && <CheckCircle className="h-4 w-4 text-green-500 inline-block ml-1" />}
              </CardTitle>
              <CardDescription className="line-clamp-1 mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3 inline-block" />
                {permit.address || "No address provided"}
              </CardDescription>
            </div>
            <Badge
              variant="secondary"
              className="bg-zoneomics-blue text-white text-xs whitespace-nowrap ml-2 flex items-center gap-1"
            >
              <Calendar className="h-3 w-3" />
              {permit.date ? formatDate(permit.date) : "Unknown"}
            </Badge>
          </div>
        </CardHeader>

        {exactMatch && (
          <div className="px-6 py-1 -mt-1 mb-1">
            <Badge className="bg-green-100 hover:bg-green-200 text-green-800 border-green-200 w-full justify-center">
              Exact Address Match
            </Badge>
          </div>
        )}

        <CardFooter className="pt-0 pb-3 text-xs text-muted-foreground">
          <div className="flex items-center">
            <span className="inline-block w-2 h-2 rounded-full bg-zoneomics-blue mr-2"></span>
            {permit.source || "Unknown Source"}
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};
