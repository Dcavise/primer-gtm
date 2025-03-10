import { cva } from "class-variance-authority"

export const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-outer-space text-seasalt hover:bg-onyx",
        secondary:
          "border-transparent bg-platinum text-outer-space hover:bg-french-gray",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-outer-space border-platinum",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
