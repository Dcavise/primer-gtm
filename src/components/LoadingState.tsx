
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  className?: string;
}

export const LoadingState = ({ className }: LoadingStateProps) => {
  return (
    <div className={cn("w-full flex flex-col gap-4", className)}>
      <div className="shimmer-bg h-8 w-3/4 rounded-md"></div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="shimmer-bg h-24 rounded-lg w-full"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
