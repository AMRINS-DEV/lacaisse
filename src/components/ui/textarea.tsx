import * as React from "react"

import { cn } from "@/lib/utils"

type TextareaProps = React.ComponentProps<"textarea"> & {
  autoLowercase?: boolean
}

function forceLowercase(target: HTMLTextAreaElement) {
  const nextValue = target.value.toLowerCase()
  if (nextValue === target.value) return

  const start = target.selectionStart
  const end = target.selectionEnd
  target.value = nextValue

  if (start !== null && end !== null) {
    target.setSelectionRange(start, end)
  }
}

function Textarea({
  className,
  autoLowercase = true,
  onChange,
  onInput,
  ...props
}: TextareaProps) {
  const handleInput = React.useCallback(
    (event: React.InputEvent<HTMLTextAreaElement>) => {
      if (autoLowercase) {
        forceLowercase(event.currentTarget)
      }
      onInput?.(event)
    },
    [autoLowercase, onInput]
  )

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (autoLowercase) {
        forceLowercase(event.currentTarget)
      }
      onChange?.(event)
    },
    [autoLowercase, onChange]
  )

  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-[88px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      onInput={handleInput}
      onChange={handleChange}
      {...props}
    />
  )
}

export { Textarea }
