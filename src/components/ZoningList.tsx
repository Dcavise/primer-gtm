
import { ZoningData } from "@/hooks/use-zoning-data";
import { LoadingState } from "./LoadingState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { CalendarIcon, HomeIcon, Building2Icon, WarehouseIcon } from "lucide-react";

interface ZoningListProps {
  zoningData: ZoningData[];
  isLoading: boolean;
  searchedAddress: string;
}

const getZoneIcon = (zoneType: string) => {
  const type = zoneType.toLowerCase();
  
  if (type.includes("residential")) {
    return <HomeIcon className="h-4 w-4" />;
  } else if (type.includes("commercial")) {
    return <Building2Icon className="h-4 w-4" />;
  } else if (type.includes("industrial")) {
    return <WarehouseIcon className="h-4 w-4" />;
  } else {
    return <Building2Icon className="h-4 w-4" />;
  }
};

export const ZoningList = ({ zoningData, isLoading, searchedAddress }: ZoningListProps) => {
  if (isLoading) {
    return <LoadingState className="mt-6" />;
  }

  if (zoningData.length === 0 && searchedAddress) {
    return (
      <div className="py-12 text-center">
        <h3 className="text-xl font-medium mb-2">No zoning data found</h3>
        <p className="text-muted-foreground">
          We couldn't find any zoning data for this location. Try adjusting your search or try a different address.
        </p>
      </div>
    );
  }

  if (!searchedAddress && !isLoading) {
    return (
      <motion.div 
        className="py-16 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <h2 className="text-2xl font-medium mb-3">Enter an address to get zoning information</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Search for zoning regulations and land use restrictions that may affect your property investment.
          Understanding zoning is critical to:
        </p>
        <ul className="mt-4 text-muted-foreground max-w-lg mx-auto text-left list-disc pl-8">
          <li className="mb-2">Determine allowed property uses and restrictions</li>
          <li className="mb-2">Identify building height and density limitations</li>
          <li className="mb-2">Verify setback and lot coverage requirements</li>
          <li className="mb-2">Understand parking and landscape regulations</li>
          <li className="mb-2">Plan for future property development options</li>
        </ul>
      </motion.div>
    );
  }

  return (
    <div className="mt-6">
      {searchedAddress && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-6"
        >
          <h2 className="text-lg md:text-xl font-medium mb-1">Zoning Results for</h2>
          <p className="text-muted-foreground">{searchedAddress}</p>
        </motion.div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {zoningData.map((zone, index) => (
          <motion.div
            key={zone.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge className="mb-2 font-medium" variant="outline">
                      {getZoneIcon(zone.zone_type)}
                      <span className="ml-1">{zone.zone_type}</span>
                    </Badge>
                    <CardTitle className="text-xl">{zone.zone_name}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                    <CalendarIcon className="h-3 w-3" />
                    Updated {new Date(zone.date_updated).toLocaleDateString()}
                  </Badge>
                </div>
                <CardDescription>{zone.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <h4 className="font-medium mb-2 text-sm">Permitted Uses:</h4>
                <ul className="text-sm text-muted-foreground">
                  {zone.permitted_uses.map((use, i) => (
                    <li key={i} className="mb-1">• {use}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
