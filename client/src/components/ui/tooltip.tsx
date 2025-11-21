"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import { cn } from "@/lib/utils"

export const TooltipProvider = TooltipPrimitive.Provider
export const Tooltip = TooltipPrimitive.Root
export const TooltipTrigger = TooltipPrimitive.Trigger

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "z-50 rounded-md border bg-white px-3 py-1.5 text-sm text-black shadow-lg",
      "animate-in fade-in zoom-in-90 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-90",
      "data-[side=bottom]:slide-in-from-top data-[side=top]:slide-in-from-bottom data-[side=left]:slide-in-from-right data-[side=right]:slide-in-from-left",
      className
    )}
    {...props}
  />
))

TooltipContent.displayName = "TooltipContent"
