import * as React from "react"
import { cn } from "@/lib/utils"

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
  disabled?: boolean
}

export const Switch = React.forwardRef<
  HTMLInputElement,
  SwitchProps
>(({ className, checked, defaultChecked, onCheckedChange, disabled = false, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onCheckedChange?.(e.target.checked)
  }

  return (
    <input
      type="checkbox"
      role="switch"
      checked={checked ?? false}
      defaultChecked={defaultChecked}
      onChange={handleChange}
      disabled={disabled}
      className={cn(
        "h-4 w-6 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-background checked:bg-primary",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Switch.displayName = "Switch"