import * as React from "react";
import { cn } from "@/lib/utils";

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "destructive";
}

export const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const base =
      "relative w-full rounded-lg border p-4 flex gap-3 items-start";

    const variants = {
      default: "bg-background text-foreground border-border",
      destructive: "bg-red-50 text-red-700 border-red-300",
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(base, variants[variant], className)}
        {...props}
      />
    );
  }
);
Alert.displayName = "Alert";

export const AlertTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("font-semibold text-sm mb-1", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

export const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";
