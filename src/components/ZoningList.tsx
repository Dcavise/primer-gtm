import { ZoningData } from "@/hooks/use-zoning-data";
import { LoadingState } from "./LoadingState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { CalendarIcon, HomeIcon, Building2Icon, WarehouseIcon, Link, CheckIcon, XIcon, AlertCircleIcon } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
      <div className="py-6 text-center">
        <h3 className="text-xl font-medium mb-2">No zoning data found</h3>
        <p className="text-muted-foreground">
          We couldn't find any zoning data for this location. Try adjusting your search or try a different address.
        </p>
      </div>
    );
  }

  if (!searchedAddress && !isLoading) {
    return null;
  }

  return (
    <div>
      {searchedAddress && zoningData.length > 0 && (
        <Alert className="mb-6 bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/30">
          <div className="flex items-start">
            <Building2Icon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="ml-3">
              <AlertTitle className="text-blue-800 dark:text-blue-300">
                Zoning information found
              </AlertTitle>
              <AlertDescription className="text-blue-700 dark:text-blue-400">
                Found zoning regulations for "{searchedAddress}".
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}
      
      <div className="grid grid-cols-1 gap-6">
        {zoningData.map((zone, index) => (
          <motion.div
            key={zone.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div>
                    <Badge className="mb-2 font-medium" variant="outline">
                      {getZoneIcon(zone.zone_type)}
                      <span className="ml-1">{zone.zone_type}</span>
                    </Badge>
                    {zone.zone_sub_type && (
                      <Badge className="mb-2 ml-2 font-medium" variant="secondary">
                        {zone.zone_sub_type}
                      </Badge>
                    )}
                    <CardTitle className="text-xl">{zone.zone_name} ({zone.zone_code})</CardTitle>
                  </div>
                  {zone.last_updated && (
                    <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                      <CalendarIcon className="h-3 w-3" />
                      Updated {new Date(zone.last_updated).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-2">{zone.description}</CardDescription>
                {zone.link && (
                  <a 
                    href={zone.link} 
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1"
                  >
                    <Link className="h-3 w-3" />
                    View official zoning information
                  </a>
                )}
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="permitted-uses">
                    <AccordionTrigger className="text-sm font-medium">
                      <div className="flex items-center gap-1">
                        <CheckIcon className="h-4 w-4 text-green-500" />
                        Permitted Uses
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      {zone.permitted_uses.length > 0 ? (
                        <ul className="text-sm text-muted-foreground">
                          {zone.permitted_uses.map((use, i) => (
                            <li key={i} className="mb-1">• {use}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No permitted uses information available.</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                  
                  {zone.conditional_uses && zone.conditional_uses.length > 0 && (
                    <AccordionItem value="conditional-uses">
                      <AccordionTrigger className="text-sm font-medium">
                        <div className="flex items-center gap-1">
                          <AlertCircleIcon className="h-4 w-4 text-amber-500" />
                          Conditional Uses
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="text-sm text-muted-foreground">
                          {zone.conditional_uses.map((use, i) => (
                            <li key={i} className="mb-1">• {use}</li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  
                  {zone.prohibited_uses && zone.prohibited_uses.length > 0 && (
                    <AccordionItem value="prohibited-uses">
                      <AccordionTrigger className="text-sm font-medium">
                        <div className="flex items-center gap-1">
                          <XIcon className="h-4 w-4 text-red-500" />
                          Prohibited Uses
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="text-sm text-muted-foreground">
                          {zone.prohibited_uses.map((use, i) => (
                            <li key={i} className="mb-1">• {use}</li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  )}
                  
                  {zone.controls && (
                    <AccordionItem value="building-controls">
                      <AccordionTrigger className="text-sm font-medium">
                        <div className="flex items-center gap-1">
                          <Building2Icon className="h-4 w-4 text-blue-500" />
                          Building Controls
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        {zone.controls.standard && Object.keys(zone.controls.standard).length > 0 ? (
                          <div className="space-y-2">
                            <h4 className="font-medium text-xs uppercase text-muted-foreground mb-1">Standard Controls</h4>
                            <ul className="text-sm">
                              {Object.entries(zone.controls.standard).map(([key, value]) => (
                                <li key={key} className="mb-1 grid grid-cols-2 gap-2">
                                  <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}:</span>
                                  <span>{value}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : null}
                        
                        {(!zone.controls.standard || Object.keys(zone.controls.standard).length === 0) && 
                         (!zone.controls["non-standard"] || Object.keys(zone.controls["non-standard"]).length === 0) && (
                          <p className="text-sm text-muted-foreground">No building controls information available.</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  )}
                </Accordion>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
