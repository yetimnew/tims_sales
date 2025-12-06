import * as React from "react"
import {
  Button as AriaButton,
  Calendar,
  CalendarCell,
  CalendarGrid,
  CalendarGridBody,
  CalendarGridHeader,
  CalendarHeaderCell,
  DateInput,
  DatePicker as AriaDatePicker,
  DateSegment,
  Dialog,
  Group,
  Heading,
  Label,
  Popover,
  Text,
  type DateValue,
} from "react-aria-components"
import { parseDate } from "@internationalized/date"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"

interface DatePickerProps {
  label?: React.ReactNode
  description?: React.ReactNode
  errorMessage?: React.ReactNode
  value?: string | null
  onChange?: (value: string | null) => void
  minValue?: string
  maxValue?: string
  placeholder?: string
  isDisabled?: boolean
  isReadOnly?: boolean
  isRequired?: boolean
  className?: string
  fieldClassName?: string
  buttonClassName?: string
  popoverClassName?: string
  calendarClassName?: string
  fullWidth?: boolean
}

const toDateValue = (value?: string | null): DateValue | undefined => {
  if (!value) {
    return undefined
  }

  try {
    return parseDate(value)
  } catch (error) {
    return undefined
  }
}

const toStringValue = (value: DateValue | null | undefined): string | null => {
  if (!value) {
    return null
  }

  try {
    return value.toString()
  } catch (error) {
    return null
  }
}

function DatePicker({
  label,
  description,
  errorMessage,
  value,
  onChange,
  minValue,
  maxValue,
  placeholder,
  isDisabled,
  isReadOnly,
  isRequired,
  className,
  fieldClassName,
  buttonClassName,
  popoverClassName,
  calendarClassName,
  fullWidth,
}: DatePickerProps) {
  const parsedValue = React.useMemo(() => toDateValue(value), [value])
  const parsedMinValue = React.useMemo(() => toDateValue(minValue), [minValue])
  const parsedMaxValue = React.useMemo(() => toDateValue(maxValue), [maxValue])

  const handleChange = React.useCallback(
    (nextValue: DateValue | null) => {
      onChange?.(toStringValue(nextValue))
    },
    [onChange],
  )

  return (
    <AriaDatePicker
      granularity="day"
      value={parsedValue}
      onChange={handleChange}
      minValue={parsedMinValue}
      maxValue={parsedMaxValue}
      isDisabled={isDisabled}
      isReadOnly={isReadOnly}
      isRequired={isRequired}
      className={cn("flex flex-col gap-2", fullWidth ? "w-full" : "w-fit", className)}
    >
      {label ? (
        <Label className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</Label>
      ) : null}

      <Group
        className={cn(
          "inline-flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm shadow-sm transition focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/20 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50",
          fullWidth ? "w-full" : "w-fit",
          fieldClassName,
        )}
      >
        <div className={cn("relative", fullWidth ? "min-w-0 flex-1" : "w-auto flex-none")}>
          {placeholder && !value ? (
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-sm text-muted-foreground">
              {placeholder}
            </span>
          ) : null}
          <DateInput
            className={cn(
              "flex items-center gap-0.5 text-sm font-medium text-foreground outline-none",
              fullWidth ? "min-w-0 flex-1 truncate" : "w-auto flex-none",
            )}
          >
            {(segment) => (
              <DateSegment
                key={segment.type + segment.text}
                segment={segment}
                className={cn(
                  "rounded px-0.5 text-sm font-medium text-foreground outline-none transition focus:bg-primary/10 focus:text-primary",
                  placeholder && !value ? "opacity-0" : undefined,
                  segment.isPlaceholder ? "text-muted-foreground" : undefined,
                  segment.type === "literal" ? "px-0 text-muted-foreground" : undefined,
                )}
              />
            )}
          </DateInput>
        </div>

        <AriaButton
          slot="button"
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
            buttonClassName,
          )}
        >
          <CalendarIcon className="h-4 w-4" aria-hidden="true" />
          <span className="sr-only">Toggle calendar</span>
        </AriaButton>
      </Group>

      {description ? (
        <Text slot="description" className="text-xs text-muted-foreground">
          {description}
        </Text>
      ) : null}

      {errorMessage ? (
        <Text slot="errorMessage" className="text-xs font-medium text-destructive">
          {errorMessage}
        </Text>
      ) : null}

      <Popover
        className={cn(
          "z-50 mt-2 w-[var(--trigger-width)] max-w-sm rounded-xl border border-input bg-background p-4 shadow-lg",
          popoverClassName,
        )}
      >
        <Dialog className="flex flex-col gap-3">
          <Calendar className={cn("space-y-3", calendarClassName)}>
            <header className="flex items-center justify-between">
              <AriaButton
                slot="previous"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </AriaButton>
              <Heading className="text-sm font-semibold text-foreground" />
              <AriaButton
                slot="next"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </AriaButton>
            </header>
            <CalendarGrid className="space-y-1 text-xs">
              <CalendarGridHeader>
                {(day) => (
                  <CalendarHeaderCell className="w-9 text-center font-semibold uppercase tracking-wide text-muted-foreground">
                    {day.substring(0, 2)}
                  </CalendarHeaderCell>
                )}
              </CalendarGridHeader>
              <CalendarGridBody>
                {(date) => (
                  <CalendarCell key={date.toString()} date={date}>
                    {({ formattedDate, isDisabled, isSelected, isOutsideMonth }) => (
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition",
                          isSelected
                            ? "bg-primary text-primary-foreground shadow"
                            : "text-foreground hover:bg-muted",
                          isOutsideMonth ? "text-muted-foreground/70" : undefined,
                          isDisabled ? "cursor-not-allowed opacity-40" : undefined,
                        )}
                      >
                        {formattedDate}
                      </span>
                    )}
                  </CalendarCell>
                )}
              </CalendarGridBody>
            </CalendarGrid>
          </Calendar>
        </Dialog>
      </Popover>
    </AriaDatePicker>
  )
}

export { DatePicker }
