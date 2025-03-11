import { Permit } from "@/types";
import { formatDate } from "@/utils/format";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ExternalLink,
  Calendar,
  Info,
  MapPin,
  User,
  Building,
  FileText,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PermitDetailProps {
  permit: Permit;
}

export const PermitDetail = ({ permit }: PermitDetailProps) => {
  const getStatusColor = (status: string) => {
    const lowerStatus = status.toLowerCase();
    if (lowerStatus.includes("approved") || lowerStatus.includes("complete")) return "bg-green-500";
    if (lowerStatus.includes("pending") || lowerStatus.includes("review")) return "bg-amber-500";
    if (lowerStatus.includes("denied") || lowerStatus.includes("reject")) return "bg-red-500";
    return "bg-blue-500";
  };

  const handleOpenLink = (url: string) => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const DetailSection = ({
    title,
    icon,
    children,
  }: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div className="mb-6">
      <div className="flex items-center mb-2">
        <div className="mr-2">{icon}</div>
        <h3 className="text-lg font-medium">{title}</h3>
      </div>
      {children}
    </div>
  );

  const DetailItem = ({ label, value }: { label: string; value: string | React.ReactNode }) => (
    <div className="grid grid-cols-3 py-1.5">
      <span className="text-muted-foreground col-span-1">{label}</span>
      <div className="col-span-2 font-medium">{value || "Not specified"}</div>
    </div>
  );

  return (
    <div className="animate-fade-in px-1">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold">{permit.project_type || "Unknown Project"}</h2>
          <p className="text-muted-foreground mt-1">{permit.address}</p>
        </div>
        <Badge
          variant="secondary"
          className={`${getStatusColor(permit.status || "Unknown")} text-white`}
        >
          {permit.status || "Unknown Status"}
        </Badge>
      </div>

      <Separator className="my-4" />

      <DetailSection
        title="Project Information"
        icon={<Info className="h-5 w-5 text-zoneomics-blue" />}
      >
        <div className="space-y-1">
          <DetailItem label="Project Name" value={permit.project_name} />
          <DetailItem label="Description" value={permit.project_brief} />
          <DetailItem label="Record ID" value={permit.record_id} />
          <DetailItem label="Permit Type" value={permit.project_type} />
          {permit.remarks && <DetailItem label="Remarks" value={permit.remarks} />}
        </div>
      </DetailSection>

      <DetailSection title="Applicant" icon={<User className="h-5 w-5 text-zoneomics-blue" />}>
        <div className="space-y-1">
          <DetailItem label="Name" value={permit.applicant} />
          <DetailItem label="Contact" value={permit.applicant_contact} />
          {permit.contact_phone_number && (
            <DetailItem
              label="Phone"
              value={
                <a
                  href={`tel:${permit.contact_phone_number}`}
                  className="text-primary hover:underline"
                >
                  {permit.contact_phone_number}
                </a>
              }
            />
          )}
          {permit.contact_email && (
            <DetailItem
              label="Email"
              value={
                <a href={`mailto:${permit.contact_email}`} className="text-primary hover:underline">
                  {permit.contact_email}
                </a>
              }
            />
          )}
        </div>
      </DetailSection>

      <DetailSection title="Location" icon={<MapPin className="h-5 w-5 text-zoneomics-blue" />}>
        <div className="space-y-1">
          <DetailItem label="Address" value={permit.address} />
          <DetailItem label="City" value={`${permit.city || "Unknown"}, ${permit.state || ""}`} />
          <DetailItem label="Postal Code" value={permit.postcode} />
          {permit.block && <DetailItem label="Block" value={permit.block} />}
          {permit.lot && <DetailItem label="Lot" value={permit.lot} />}
        </div>
      </DetailSection>

      <DetailSection title="Zoning" icon={<Building className="h-5 w-5 text-zoneomics-blue" />}>
        <div className="space-y-1">
          <DetailItem
            label="Pre-Classification"
            value={permit.zoning_classification_pre || "Not specified"}
          />
          <DetailItem
            label="Post-Classification"
            value={permit.zoning_classification_post || "Not specified"}
          />
          <DetailItem label="Authority" value={permit.authority} />
        </div>
      </DetailSection>

      <DetailSection title="Dates" icon={<Calendar className="h-5 w-5 text-zoneomics-blue" />}>
        <div className="space-y-1">
          <DetailItem
            label="Filed Date"
            value={permit.date ? formatDate(permit.date) : "Unknown"}
          />
          <DetailItem
            label="Created"
            value={permit.created_date ? formatDate(permit.created_date) : "Unknown"}
          />
          <DetailItem
            label="Last Updated"
            value={permit.last_updated_date ? formatDate(permit.last_updated_date) : "Unknown"}
          />
        </div>
      </DetailSection>

      {(permit.record_link || permit.document_link) && (
        <DetailSection
          title="Documents"
          icon={<FileText className="h-5 w-5 text-zoneomics-blue" />}
        >
          <div className="flex flex-col gap-2">
            {permit.record_link && (
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => handleOpenLink(permit.record_link)}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Permit Record
              </Button>
            )}
            {permit.document_link && (
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => handleOpenLink(permit.document_link)}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                View Permit Document
              </Button>
            )}
          </div>
        </DetailSection>
      )}

      {permit.comments && (
        <DetailSection
          title="Additional Information"
          icon={<Info className="h-5 w-5 text-zoneomics-blue" />}
        >
          <div className="p-3 bg-secondary rounded-md">
            <p className="text-sm">{permit.comments}</p>
          </div>
        </DetailSection>
      )}

      <div className="text-xs text-muted-foreground mt-6 flex items-center">
        <Clock className="h-3 w-3 mr-1" />
        Last updated: {permit.last_updated_date ? formatDate(permit.last_updated_date) : "Unknown"}
      </div>
    </div>
  );
};
