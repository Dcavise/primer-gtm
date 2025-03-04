
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/LoadingState";
import { Permit } from "@/types";
import { ZoningData } from "@/hooks/use-zoning-data";
import { CensusData, CensusResponse } from "@/types";
import { School } from "@/types/schools";
import { CalendarIcon, ClipboardIcon, MapIcon, BarChart3Icon, School as SchoolIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface PropertySummaryProps {
  summary: string | null;
  isLoading: boolean;
  searchedAddress: string;
  onGenerateSummary: () => void;
}

export const PropertySummary = ({ 
  summary, 
  isLoading, 
  searchedAddress,
  onGenerateSummary
}: PropertySummaryProps) => {
  // Function to render the summary with formatting
  const renderFormattedSummary = (text: string) => {
    if (!text) return null;
    
    // Split by bullet points and other formatting
    const parts = text.split(/\n+/);
    
    return parts.map((part, index) => {
      // Check if it's a bullet point
      if (part.trim().startsWith('•') || part.trim().startsWith('-')) {
        return <li key={index} className="ml-6 my-1">{part.trim().replace(/^[•-]\s*/, '')}</li>;
      }
      
      // Check if it's a header (assuming headers end with a colon)
      if (part.trim().endsWith(':')) {
        return <h4 key={index} className="font-medium text-lg mt-3 mb-1">{part}</h4>;
      }
      
      // Regular paragraph
      return part.trim() ? <p key={index} className="my-2">{part}</p> : null;
    });
  };

  // If still loading
  if (isLoading) {
    return (
      <LoadingState 
        title="Generating property summary" 
        description="Our AI is analyzing all available property data to generate a comprehensive summary..."
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardIcon className="h-5 w-5 text-muted-foreground" />
            Property Summary
          </CardTitle>
          <CardDescription>
            AI-generated summary of all available property data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {summary ? renderFormattedSummary(summary) : (
              <p className="text-muted-foreground">No summary available.</p>
            )}
          </div>
          
          <div className="mt-6 pt-6 border-t flex flex-wrap gap-3">
            <div className="text-xs flex items-center gap-1.5 text-muted-foreground">
              <MapIcon className="h-3.5 w-3.5" />
              <span>Zoning</span>
            </div>
            <div className="text-xs flex items-center gap-1.5 text-muted-foreground">
              <CalendarIcon className="h-3.5 w-3.5" />
              <span>Permits</span>
            </div>
            <div className="text-xs flex items-center gap-1.5 text-muted-foreground">
              <BarChart3Icon className="h-3.5 w-3.5" />
              <span>Census</span>
            </div>
            <div className="text-xs flex items-center gap-1.5 text-muted-foreground">
              <SchoolIcon className="h-3.5 w-3.5" />
              <span>Schools</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
