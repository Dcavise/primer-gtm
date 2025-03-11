import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Spinner component for loading states
 */
export function Spinner({
  className,
  size = "default",
}: {
  className?: string;
  size?: "sm" | "default" | "lg";
}) {
  const sizeClass = {
    sm: "h-4 w-4",
    default: "h-6 w-6",
    lg: "h-8 w-8",
  };

  return (
    <Loader2 className={cn(`animate-spin ${sizeClass[size]}`, className)} />
  );
}

/**
 * Loading overlay component
 */
export function LoadingOverlay({
  children,
  loading,
  blur = true,
  spinnerSize = "default",
  className,
  overlayClassName,
}: {
  children: React.ReactNode;
  loading: boolean;
  blur?: boolean;
  spinnerSize?: "sm" | "default" | "lg";
  className?: string;
  overlayClassName?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      {children}
      {loading && (
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center bg-seasalt/80",
            blur && "backdrop-blur-[2px]",
            overlayClassName,
          )}
        >
          <Spinner size={spinnerSize} />
        </div>
      )}
    </div>
  );
}

/**
 * Card skeleton component
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="h-[125px] w-full rounded-lg bg-platinum" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-[80%] bg-platinum" />
        <Skeleton className="h-4 w-[60%] bg-platinum" />
      </div>
    </div>
  );
}

/**
 * Table row skeleton component
 */
export function TableRowSkeleton({
  columns = 4,
  className,
}: {
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center space-x-4 py-3", className)}>
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 w-[${100 / columns - 5}%] bg-platinum`}
        />
      ))}
    </div>
  );
}

/**
 * Form skeleton component
 */
export function FormSkeleton({
  rows = 3,
  className,
}: {
  rows?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-[30%] bg-platinum" />
          <Skeleton className="h-10 w-full bg-platinum" />
        </div>
      ))}
    </div>
  );
}

/**
 * Text skeleton component
 */
export function TextSkeleton({
  lines = 3,
  lastLineWidth = 70,
  className,
}: {
  lines?: number;
  lastLineWidth?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <Skeleton key={i} className="h-4 w-full bg-platinum" />
      ))}
      <Skeleton className={`h-4 w-[${lastLineWidth}%] bg-platinum`} />
    </div>
  );
}
