
import { Permit } from "@/types";
import { formatDate } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";

interface PermitCardProps {
  permit: Permit;
  onClick: () => void;
  delay?: number;
}

export const PermitCard = ({ permit, onClick, delay = 0 }: PermitCardProps) => {
  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("approved") || lowerStatus.includes("complete")) return "bg-green-500";
    if (lowerStatus.includes("pending") || lowerStatus.includes("review")) return "bg-amber-500";
    if (lowerStatus.includes("denied") || lowerStatus.includes("reject")) return "bg-red-500";
    return "bg-blue-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: delay * 0.1 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <Card 
        className="overflow-hidden border border-border/40 hover:border-border/80 transition-all cursor-pointer group bg-card/80 backdrop-blur-sm"
        onClick={onClick}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="line-clamp-1 text-lg md:text-xl group-hover:text-primary transition-colors">
                {permit.project_type || "Unknown Project Type"}
              </CardTitle>
              <CardDescription className="line-clamp-1 mt-1">
                {permit.address}
              </CardDescription>
            </div>
            <Badge 
              variant="secondary"
              className={`${getStatusColor(permit.status || "Unknown")} text-white text-xs whitespace-nowrap ml-2`}
            >
              {permit.status || "Unknown Status"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Applicant:</span> 
              <span className="ml-1 font-medium">{permit.applicant || "Not specified"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Date:</span> 
              <span className="ml-1 font-medium">{permit.date ? formatDate(permit.date) : "Unknown"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Project:</span> 
              <span className="ml-1 font-medium line-clamp-1">{permit.project_name || "Not specified"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">ID:</span> 
              <span className="ml-1 font-medium">{permit.record_id || "Unknown"}</span>
            </div>
          </div>
        </CardContent>
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
