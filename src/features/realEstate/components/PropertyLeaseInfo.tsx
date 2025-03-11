import React, { useState, useEffect } from "react";
import { Edit, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoadingState } from "@/components/LoadingState";
import { RealEstateProperty, LeaseStatus } from "@/types/realEstate";
import { supabase } from "@/integrations/supabase-client";
import { toast } from "sonner";
import { LeaseStatusSelector } from "./LeaseStatusSelector";
import { ErrorBoundary } from "@/components/error-boundary";

interface PropertyLeaseInfoProps {
  property: RealEstateProperty;
  onPropertyUpdated: () => void;
}

const PropertyLeaseInfo: React.FC<PropertyLeaseInfoProps> = ({
  property,
  onPropertyUpdated,
}) => {
  // Individual field edit states
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>(
    {},
  );
  const [savingFields, setSavingFields] = useState<Record<string, boolean>>({});
  // Update type to match our form inputs
  const [fieldValues, setFieldValues] = useState<
    Record<string, LeaseStatus | null>
  >({
    loi_status: null,
    lease_status: null,
  });

  // Initialize field values when property changes
  useEffect(() => {
    if (property) {
      setFieldValues({
        loi_status: property.loi_status || null,
        lease_status: property.lease_status || null,
      });
    }
  }, [property]);

  const handleEditField = (fieldName: string) => {
    setEditingFields((prev) => ({ ...prev, [fieldName]: true }));
    setFieldValues((prev) => ({
      ...prev,
      [fieldName]: property[
        fieldName as keyof RealEstateProperty
      ] as LeaseStatus | null,
    }));
  };

  const handleCancelField = (fieldName: string) => {
    setEditingFields((prev) => ({ ...prev, [fieldName]: false }));
    setFieldValues((prev) => ({
      ...prev,
      [fieldName]: property[
        fieldName as keyof RealEstateProperty
      ] as LeaseStatus | null,
    }));
  };

  const handleFieldChange = (fieldName: string, value: LeaseStatus | "") => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldName]: value === "" ? null : value,
    }));
  };

  const handleSaveField = async (fieldName: string) => {
    if (!property.id) return;

    setSavingFields((prev) => ({ ...prev, [fieldName]: true }));

    try {
      // Use the current field value
      const valueToSave = fieldValues[fieldName];

      const { error } = await supabase
        .from("real_estate_pipeline")
        .update({ [fieldName]: valueToSave })
        .eq("id", property.id);

      if (error) {
        console.error(`Error saving ${fieldName}:`, error);
        toast.error(`Failed to save ${fieldName}`);
      } else {
        setEditingFields((prev) => ({ ...prev, [fieldName]: false }));
        toast.success(`${fieldName} updated successfully`);
        onPropertyUpdated();
      }
    } catch (error) {
      console.error(`Error saving ${fieldName}:`, error);
      toast.error(`Failed to save ${fieldName}`);
    } finally {
      setSavingFields((prev) => ({ ...prev, [fieldName]: false }));
    }
  };

  const renderLeaseStatusField = (
    fieldName: "loi_status" | "lease_status",
    label: string,
  ) => {
    const isFieldEditing = editingFields[fieldName] || false;
    const isFieldSaving = savingFields[fieldName] || false;

    return (
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">{label}</p>
          {!isFieldEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditField(fieldName)}
              className="h-6 px-2"
            >
              <Edit className="h-3 w-3" />
            </Button>
          )}
        </div>

        {isFieldEditing ? (
          <div className="space-y-2">
            <ErrorBoundary>
              <LeaseStatusSelector
                value={fieldValues[fieldName]}
                onValueChange={(value) => handleFieldChange(fieldName, value)}
                disabled={isFieldSaving}
              />
            </ErrorBoundary>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleCancelField(fieldName)}
                disabled={isFieldSaving}
                className="h-7 px-2 text-xs"
              >
                <X className="h-3 w-3 mr-1" /> Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleSaveField(fieldName)}
                disabled={isFieldSaving}
                className="h-7 px-2 text-xs"
              >
                {isFieldSaving ? (
                  <LoadingState message="Saving..." showSpinner={true} />
                ) : (
                  <>
                    <Save className="h-3 w-3 mr-1" /> Save
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          <p className="font-medium">
            {property[fieldName as keyof RealEstateProperty] || "Not specified"}
          </p>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Lease Information</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {renderLeaseStatusField("loi_status", "LOI Status")}
        {renderLeaseStatusField("lease_status", "Lease Status")}
      </CardContent>
    </Card>
  );
};

export default PropertyLeaseInfo;
