import * as React from "react"

import { cn } from "@/lib/utils"

type InputProps = React.ComponentProps<"input"> & {
  autoLowercase?: boolean
}

const LOWERCASE_TYPES = new Set(["", "text", "email", "search", "url", "tel"])

function shouldLowercaseInput(type?: string) {
  return LOWERCASE_TYPES.has((type ?? "").toLowerCase())
}

function forceLowercase(target: HTMLInputElement) {
  const nextValue = target.value.toLowerCase()
  if (nextValue === target.value) return

  const start = target.selectionStart
  const end = target.selectionEnd
  target.value = nextValue

  if (start !== null && end !== null) {
    try {
      target.setSelectionRange(start, end)
    } catch {
      // Some input types may not support selection API.
    }
  }
}

function Input({
  className,
  type,
  autoLowercase,
  onChange,
  onInput,
  ...props
}: InputProps) {
  const lowercaseEnabled = autoLowercase ?? shouldLowercaseInput(type)

  const handleInput = React.useCallback(
    (event: React.InputEvent<HTMLInputElement>) => {
      if (lowercaseEnabled) {
        forceLowercase(event.currentTarget)
      }
      onInput?.(event)
    },
    [lowercaseEnabled, onInput]
  )

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (lowercaseEnabled) {
        forceLowercase(event.currentTarget)
      }
      onChange?.(event)
    },
    [lowercaseEnabled, onChange]
  )

  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      onInput={handleInput}
      onChange={handleChange}
      {...props}
    />
  )
}

export { Input }
