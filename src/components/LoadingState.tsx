
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  className?: string;
  message?: string;
  showSpinner?: boolean;
}

export const LoadingState = ({ className, message = "Loading...", showSpinner = false }: LoadingStateProps) => {
  return (
    <div className={cn("w-full flex flex-col gap-4", className)}>
      {showSpinner ? (
        <div className="flex items-center space-x-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-outer-space border-t-transparent"></div>
          <span>{message}</span>
        </div>
      ) : (
        <div className="shimmer-bg h-8 w-3/4 rounded-md bg-platinum">
          {message && <div className="sr-only">{message}</div>}
        </div>
      )}
      
      {!showSpinner && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="shimmer-bg h-24 rounded-lg w-full bg-platinum"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
