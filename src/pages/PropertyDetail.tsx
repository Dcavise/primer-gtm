import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase-client";
import { logger } from "@/utils/logger";
import {
  RealEstateProperty,
  PropertyPhase,
  BooleanStatus,
  SurveyStatus,
  TestFitStatus,
  LeaseStatus,
} from "@/types/realEstate";
import { Button } from "@/components/ui/button";
import { LoadingState } from "@/components/LoadingState";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import PropertyHeader from "@/features/realEstate/components/PropertyHeader";
import PropertyNotFound from "@/features/realEstate/components/PropertyNotFound";
import PropertyBasicInfo from "@/features/realEstate/components/PropertyBasicInfo";
import PropertyStatusInfo from "@/features/realEstate/components/PropertyStatusInfo";
import PropertyNotes from "@/features/realEstate/components/PropertyNotes";
import PropertyContactInfo from "@/features/realEstate/components/PropertyContactInfo";
import PropertyLeaseInfo from "@/features/realEstate/components/PropertyLeaseInfo";
import PropertyDocuments from "@/features/realEstate/components/PropertyDocuments";
import PropertyDiscussion from "@/features/realEstate/components/PropertyDiscussion";
import PropertyLocation from "@/features/realEstate/components/PropertyLocation";
import PropertyProgress from "@/features/realEstate/components/PropertyProgress";

const PropertyDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [fileRefreshKey, setFileRefreshKey] = useState(0);

  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const {
    data: property,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["property", id],
    queryFn: async (): Promise<RealEstateProperty | null> => {
      if (!id) {
        logger.error("No property ID provided");
        return null;
      }

      logger.debug("Fetching property with id:", id);

      const propertyId = parseInt(id);

      if (isNaN(propertyId)) {
        logger.error("Invalid property ID:", id);
        throw new Error(`Invalid property ID: ${id}`);
      }

      try {
        const { data, error } = await supabase
          .from("real_estate_pipeline")
          .select("*")
          .eq("id", propertyId)
          .maybeSingle();

        if (error) {
          logger.error("Error fetching property details:", error);
          throw new Error(`Failed to fetch property details: ${error.message}`);
        }

        if (!data) {
          logger.error("Property not found with id:", id);
          return null;
        }

        logger.debug("Found property:", data);
        return data;
      } catch (error: any) {
        logger.error("Error during property fetch:", error);
        toast.error(`Error loading property: ${error.message}`);
        return null;
      }
    },
    retry: 1, // Only retry once to avoid too many requests
    retryDelay: 1000, // Wait 1 second before retrying
  });

  useEffect(() => {
    if (property) {
      if (property.status_notes) {
        setNotesValue(property.status_notes);
      }
    }
  }, [property]);

  const handleBackClick = () => {
    navigate("/real-estate-pipeline");
  };

  const handleFileUploadComplete = () => {
    setFileRefreshKey((prev) => prev + 1);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotesValue(e.target.value);
  };

  const handleEditNotes = () => {
    setIsEditingNotes(true);
  };

  const handleCancelEditNotes = () => {
    if (property && property.status_notes) {
      setNotesValue(property.status_notes);
    } else {
      setNotesValue("");
    }
    setIsEditingNotes(false);
  };

  const handleSaveNotes = async () => {
    if (!id) return;

    setIsSavingNotes(true);
    try {
      const { error } = await supabase
        .from("real_estate_pipeline")
        .update({ status_notes: notesValue })
        .eq("id", parseInt(id));

      if (error) {
        logger.error("Error saving notes:", error);
        toast.error("Failed to save notes");
        return;
      }

      setIsEditingNotes(false);
      toast.success("Notes saved successfully");
      refetch();
    } catch (error) {
      logger.error("Error saving notes:", error);
      toast.error("Failed to save notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Loading property details..." />;
  }

  if (error || !property) {
    return <PropertyNotFound />;
  }

  return (
    <div className="min-h-screen bg-background">
      <PropertyHeader property={property} />

      <main className="container mx-auto py-8 px-4">
        <Button
          variant="outline"
          onClick={() => navigate("/real-estate-pipeline")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Pipeline
        </Button>

        <PropertyProgress phase={property.phase} />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            {property.address && (
              <PropertyLocation address={property.address} />
            )}

            <PropertyBasicInfo
              property={property}
              onPropertyUpdated={() => refetch()}
            />

            <PropertyStatusInfo
              property={property}
              onPropertyUpdated={() => refetch()}
            />

            <PropertyNotes
              property={property}
              isEditing={isEditingNotes}
              isSaving={isSavingNotes}
              notesValue={notesValue}
              onEdit={() => setIsEditingNotes(true)}
              onCancel={() => {
                if (property.status_notes) {
                  setNotesValue(property.status_notes);
                } else {
                  setNotesValue("");
                }
                setIsEditingNotes(false);
              }}
              onSave={async () => {
                if (!id) return;

                setIsSavingNotes(true);
                try {
                  const { error } = await supabase
                    .from("real_estate_pipeline")
                    .update({ status_notes: notesValue })
                    .eq("id", parseInt(id));

                  if (error) {
                    logger.error("Error saving notes:", error);
                    toast.error("Failed to save notes");
                    return;
                  }

                  setIsEditingNotes(false);
                  toast.success("Notes saved successfully");
                  refetch();
                } catch (error) {
                  logger.error("Error saving notes:", error);
                  toast.error("Failed to save notes");
                } finally {
                  setIsSavingNotes(false);
                }
              }}
              onNotesChange={(e) => setNotesValue(e.target.value)}
            />

            <PropertyDiscussion propertyId={property.id} />
          </div>

          <div className="space-y-6">
            <PropertyContactInfo
              property={property}
              onPropertyUpdated={() => refetch()}
            />

            <PropertyDocuments
              propertyId={property.id}
              fileRefreshKey={fileRefreshKey}
              onUploadComplete={() => setFileRefreshKey((prev) => prev + 1)}
            />

            <PropertyLeaseInfo
              property={property}
              onPropertyUpdated={() => refetch()}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default PropertyDetail;
