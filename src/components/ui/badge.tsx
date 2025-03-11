import * as React from "react";
import { type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { badgeVariants } from "@/components/ui/badge-variants";

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  // Filter out Salesforce IDs from badge content
  const children = props.children;

  // Check if content looks like a Salesforce ID (18 or 15 character alphanumeric string)
  const isSalesforceId =
    typeof children === "string" &&
    /^[a-zA-Z0-9]{15,18}$/.test(children.toString());

  // Don't render the badge if it contains a Salesforce ID
  if (isSalesforceId) {
    return null;
  }

  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge };
