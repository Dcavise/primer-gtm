import { tv } from "tailwind-variants";

export const metricCard = tv({
  base: "border shadow-sm overflow-hidden transition-colors",
  variants: {
    importance: {
      primary: "border-primary/40 hover:border-primary/70",
      secondary: "border-muted/40 hover:border-muted/70",
    },
    size: {
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    },
    status: {
      positive: "border-l-4 border-l-green-500",
      negative: "border-l-4 border-l-destructive",
      neutral: "",
    },
    interactive: {
      true: "hover:bg-muted/5 cursor-pointer",
      false: "",
    },
  },
  defaultVariants: {
    importance: "secondary",
    size: "md",
    status: "neutral",
    interactive: false,
  },
});

export const metricValue = tv({
  base: "text-2xl font-bold",
  variants: {
    size: {
      sm: "text-xl",
      md: "text-2xl",
      lg: "text-3xl",
    },
    emphasis: {
      normal: "",
      high: "text-primary",
      low: "text-muted-foreground",
    },
  },
  defaultVariants: {
    size: "md",
    emphasis: "normal",
  },
});

export const metricLabel = tv({
  base: "text-sm font-medium text-muted-foreground flex items-center",
  variants: {
    withIcon: {
      true: "gap-2",
      false: "",
    },
  },
  defaultVariants: {
    withIcon: false,
  },
});

export const metricDescription = tv({
  base: "text-xs text-muted-foreground mt-1",
  variants: {
    style: {
      subtle: "opacity-80",
      normal: "",
    },
  },
  defaultVariants: {
    style: "normal",
  },
});
