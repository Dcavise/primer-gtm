
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { LoadingState } from "@/components/LoadingState";
import { Permit } from "@/types";
import { ZoningData } from "@/hooks/use-zoning-data";
import { CensusData, CensusResponse } from "@/types";
import { School } from "@/types/schools";
import { 
  CalendarIcon, 
  ClipboardIcon, 
  MapIcon, 
  BarChart3Icon, 
  School as SchoolIcon,
  Home,
  ArrowRight,
  Building,
  Users,
  Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyMap } from "./PropertyMap";
import { Separator } from "@/components/ui/separator";

interface PropertySummaryProps {
  summary: string | null;
  isLoading: boolean;
  searchedAddress: string;
  onGenerateSummary: () => void;
  schools?: School[];
  coordinates?: { lat: number; lng: number } | null;
}

export const PropertySummary = ({ 
  summary, 
  isLoading, 
  searchedAddress,
  onGenerateSummary,
  schools = [],
  coordinates = null,
}: PropertySummaryProps) => {
  const [activeTab, setActiveTab] = useState<"summary" | "map">("summary");
  
  // Get only elementary schools
  const elementarySchools = schools
    .filter(school => school.educationLevel?.toLowerCase().includes('elementary'))
    .sort((a, b) => (a.location?.distanceMiles || 0) - (b.location?.distanceMiles || 0))
    .slice(0, 5);

  // Function to render the summary with formatting
  const renderFormattedSummary = (text: string) => {
    if (!text) return null;
    
    // Split by bullet points and other formatting
    const parts = text.split(/\n+/);
    
    return parts.map((part, index) => {
      // Check if it's a bullet point
      if (part.trim().startsWith('•') || part.trim().startsWith('-')) {
        return (
          <motion.li 
            key={index} 
            className="ml-6 my-2 flex items-start gap-2"
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index, duration: 0.3 }}
          >
            <div className="mt-1.5 flex-shrink-0">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
            </div>
            <span>{part.trim().replace(/^[•-]\s*/, '')}</span>
          </motion.li>
        );
      }
      
      // Check if it's a header (assuming headers end with a colon)
      if (part.trim().endsWith(':')) {
        return (
          <motion.h4 
            key={index} 
            className="font-medium text-lg mt-6 mb-2 text-blue-700 dark:text-blue-300 flex items-center gap-1.5"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index, duration: 0.3 }}
          >
            {getHeaderIcon(part.trim())}
            {part}
          </motion.h4>
        );
      }
      
      // Check if it contains "Property Summary" (the title)
      if (part.trim().includes('Property Summary:')) {
        return (
          <motion.h3 
            key={index} 
            className="font-bold text-xl mb-4 text-blue-800 dark:text-blue-200 border-b pb-2 border-blue-200 dark:border-blue-800"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {part}
          </motion.h3>
        );
      }
      
      // Regular paragraph
      return part.trim() ? (
        <motion.p 
          key={index} 
          className="my-2 text-slate-700 dark:text-slate-300"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.05 * index, duration: 0.4 }}
        >
          {part}
        </motion.p>
      ) : null;
    });
  };

  // Helper function to get icons for different summary sections
  const getHeaderIcon = (header: string) => {
    const lowerHeader = header.toLowerCase();
    
    if (lowerHeader.includes('zoning')) {
      return <MapIcon className="h-4 w-4 text-purple-500" />;
    } else if (lowerHeader.includes('permits') || lowerHeader.includes('development')) {
      return <CalendarIcon className="h-4 w-4 text-orange-500" />;
    } else if (lowerHeader.includes('demographics') || lowerHeader.includes('neighborhood')) {
      return <Users className="h-4 w-4 text-green-500" />;
    } else if (lowerHeader.includes('schools') || lowerHeader.includes('education')) {
      return <SchoolIcon className="h-4 w-4 text-blue-500" />;
    } else if (lowerHeader.includes('property') || lowerHeader.includes('overview')) {
      return <Home className="h-4 w-4 text-indigo-500" />;
    } else if (lowerHeader.includes('economic') || lowerHeader.includes('income')) {
      return <Coins className="h-4 w-4 text-emerald-500" />;
    } else if (lowerHeader.includes('building') || lowerHeader.includes('structure')) {
      return <Building className="h-4 w-4 text-amber-500" />;
    }
    
    return <ArrowRight className="h-4 w-4 text-gray-500" />;
  };

  // If still loading
  if (isLoading) {
    return (
      <LoadingState 
        message="Generating property summary..."
        className="py-8"
      />
    );
  }

  // If no address entered yet
  if (!searchedAddress) {
    return (
      <div className="text-center py-10">
        <div className="mx-auto h-24 w-24 text-muted-foreground mb-4 flex items-center justify-center">
          <ClipboardIcon className="h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium mb-2">No Property Summary</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Enter an address in the search bar above to generate a comprehensive property summary using AI.
        </p>
      </div>
    );
  }

  // If no summary is available but we have an address
  if (!summary && searchedAddress) {
    return (
      <div className="text-center py-10">
        <div className="mx-auto h-24 w-24 text-muted-foreground mb-4 flex items-center justify-center">
          <ClipboardIcon className="h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium mb-2">Summary Not Available</h3>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          Click the button below to generate an AI summary for this property.
        </p>
        <Button onClick={onGenerateSummary}>
          Generate Summary
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="overflow-hidden border-blue-100 dark:border-blue-900/30">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-full">
                <ClipboardIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-lg">Property Summary</CardTitle>
            </div>
            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50">
              AI Generated
            </Badge>
          </div>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            Comprehensive analysis of available property data
          </CardDescription>
          
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as "summary" | "map")}
            className="mt-2"
          >
            <TabsList className="bg-white/50 dark:bg-slate-900/50">
              <TabsTrigger value="summary" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-blue-300">
                <ClipboardIcon className="h-4 w-4 mr-2" />
                Summary
              </TabsTrigger>
              <TabsTrigger value="map" className="data-[state=active]:bg-white data-[state=active]:text-blue-700 dark:data-[state=active]:bg-slate-800 dark:data-[state=active]:text-blue-300">
                <MapIcon className="h-4 w-4 mr-2" />
                Map & Schools
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <TabsContent value="summary" className="m-0 p-0">
          <CardContent className="bg-white dark:bg-slate-950/50 pt-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {summary ? renderFormattedSummary(summary) : (
                <p className="text-muted-foreground">No summary available.</p>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="bg-slate-50 dark:bg-slate-900/20 p-4 flex flex-wrap gap-3 border-t border-slate-100 dark:border-slate-800/50">
            <div className="text-xs flex items-center gap-1.5 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">
              <MapIcon className="h-3.5 w-3.5" />
              <span>Zoning</span>
            </div>
            <div className="text-xs flex items-center gap-1.5 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-full">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Permits</span>
            </div>
            <div className="text-xs flex items-center gap-1.5 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
              <BarChart3Icon className="h-3.5 w-3.5" />
              <span>Census</span>
            </div>
            <div className="text-xs flex items-center gap-1.5 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-full">
              <SchoolIcon className="h-3.5 w-3.5" />
              <span>Schools</span>
            </div>
          </CardFooter>
        </TabsContent>
        
        <TabsContent value="map" className="m-0 p-0">
          <div className="relative h-[400px] md:h-[500px]">
            <PropertyMap 
              address={searchedAddress}
              schools={elementarySchools}
              coordinates={coordinates}
            />
          </div>
          
          {elementarySchools.length > 0 ? (
            <div className="p-4 bg-slate-50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-2 mb-3">
                <SchoolIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h4 className="font-medium text-sm">Nearest Elementary Schools</h4>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {elementarySchools.map((school, index) => (
                  <div 
                    key={school.id || index}
                    className="flex items-center justify-between py-1.5 px-3 bg-white dark:bg-slate-800/40 rounded border border-slate-100 dark:border-slate-700/30 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline"
                        className="h-5 w-5 p-0 flex items-center justify-center text-xs font-semibold rounded-full bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                      >
                        {index + 1}
                      </Badge>
                      <span className="font-medium">{school.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {school.ratings?.overall && (
                        <Badge 
                          className={`
                            ${getRatingColor(school.ratings.overall)}
                          `}
                        >
                          {school.ratings.overall}/10
                        </Badge>
                      )}
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {school.location?.distanceMiles?.toFixed(1) || '?'} mi
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/20 border-t border-slate-100 dark:border-slate-800/50">
              No elementary schools found nearby
            </div>
          )}
        </TabsContent>
      </Card>
    </motion.div>
  );
};

// Helper function to get badge color based on school rating
function getRatingColor(rating: number): string {
  if (rating >= 8) {
    return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800/50';
  } else if (rating >= 6) {
    return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/50';
  } else if (rating >= 4) {
    return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800/50';
  } else {
    return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/50';
  }
}
