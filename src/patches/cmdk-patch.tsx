import React, { useEffect } from "react";

// This component will patch Array.from globally when mounted
export function CMDKPatcher() {
  useEffect(() => {
    // Store the original Array.from method
    const originalArrayFrom = Array.from;

    // Replace Array.from with a safe version
    // @ts-ignore - We're intentionally monkey-patching a global method
    Array.from = function safePatchedArrayFrom(items, ...rest) {
      // If items is undefined or null, return an empty array
      if (items == null) {
        console.warn(
          "CMDK Patch: Array.from received undefined/null, returning empty array",
        );
        return [];
      }

      // Otherwise use the original method
      return originalArrayFrom.call(Array, items, ...rest);
    };

    // Clean up function to restore original behavior when component unmounts
    return () => {
      // @ts-ignore
      Array.from = originalArrayFrom;
    };
  }, []);

  // This component doesn't render anything
  return null;
}
