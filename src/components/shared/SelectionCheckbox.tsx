"use client";

type SelectionCheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  ariaLabel: string;
};

export function SelectionCheckbox({
  checked,
  onCheckedChange,
  ariaLabel,
}: SelectionCheckboxProps) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={(event) => onCheckedChange(event.target.checked)}
      aria-label={ariaLabel}
      className="h-4 w-4 rounded border-slate-300 bg-white text-[var(--logo-primary)] accent-[var(--logo-primary)] focus:ring-2 focus:ring-[var(--logo-secondary)] dark:border-white/20 dark:bg-slate-900"
    />
  );
}
