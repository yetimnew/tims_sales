import * as React from "react"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react"
import { DayPicker, type ChevronProps } from "react-day-picker"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

const CalendarChevron = ({
  orientation = "left",
  className,
  disabled,
  size = 16,
}: ChevronProps) => {
  const Icon =
    orientation === "up"
      ? ChevronUp
      : orientation === "down"
        ? ChevronDown
        : orientation === "right"
          ? ChevronRight
          : ChevronLeft

  return (
    <Icon
      aria-hidden="true"
      className={cn("size-4 text-muted-foreground", disabled && "opacity-40", className)}
      size={size}
    />
  )
}







