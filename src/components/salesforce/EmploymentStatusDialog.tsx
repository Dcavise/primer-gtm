import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { EmploymentStatusCount } from "@/hooks/salesforce/types";
import { formatNumber } from "@/utils/format";

interface EmploymentStatusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: EmploymentStatusCount[];
  campusName: string | null;
}

export const EmploymentStatusDialog: React.FC<EmploymentStatusDialogProps> = ({
  open,
  onOpenChange,
  data,
  campusName,
}) => {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Fellow Employment Status Distribution</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground mb-4">
          {campusName ? `Data for ${campusName}` : "Data for all campuses"}
        </div>

        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.status} className="flex flex-col">
              <div className="flex justify-between mb-1">
                <span className="font-medium">{item.status}</span>
                <span className="text-muted-foreground">
                  {formatNumber(item.count)}
                  <span className="text-xs ml-1 text-muted-foreground">
                    ({((item.count / total) * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${(item.count / total) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between font-medium">
            <span>Total Fellows:</span>
            <span>{formatNumber(total)}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
