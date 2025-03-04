
import { useState } from "react";
import { Permit } from "@/types";
import { PermitCard } from "./PermitCard";
import { PermitDetail } from "./PermitDetail";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { LoadingState } from "./LoadingState";

interface PermitListProps {
  permits: Permit[];
  isLoading: boolean;
  searchedAddress: string;
}

export const PermitList = ({ permits, isLoading, searchedAddress }: PermitListProps) => {
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const handlePermitClick = (permit: Permit) => {
    setSelectedPermit(permit);
    setIsDetailOpen(true);
  };

  if (isLoading) {
    return <LoadingState className="mt-6" />;
  }

  if (permits.length === 0 && searchedAddress) {
    return (
      <div className="py-12 text-center">
        <h3 className="text-xl font-medium mb-2">No permits found</h3>
        <p className="text-muted-foreground">
          We couldn't find any permit data for this location. Try adjusting your search or try a different address.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {permits.map((permit, index) => (
          <PermitCard
            key={permit.id || index}
            permit={permit}
            onClick={() => handlePermitClick(permit)}
            delay={index}
            searchedAddress={searchedAddress}
          />
        ))}
      </div>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="sm:max-w-2xl mx-auto">
          {selectedPermit && <PermitDetail permit={selectedPermit} />}
        </DialogContent>
      </Dialog>
    </>
  );
};
