import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names using clsx and optimizes them with tailwind-merge.
 * This utility helps with conditional and dynamic className generation.
 *
 * @param inputs - Class values to be combined
 * @returns Optimized className string
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
