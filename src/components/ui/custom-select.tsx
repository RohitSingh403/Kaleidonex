import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string | number;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface CustomSelectProps {
  value?: string | number;
  defaultValue?: string | number;
  onValueChange?: (val: string) => void;
  onChange?: (val: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  name?: string;
}

export function CustomSelect({
  value,
  defaultValue,
  onValueChange,
  onChange,
  options,
  placeholder,
  className,
  triggerClassName,
  disabled = false,
  name,
}: CustomSelectProps) {
  const handleChange = (val: string) => {
    if (onValueChange) onValueChange(val);
    if (onChange) onChange(val);
  };

  const selectProps: Record<string, unknown> = {
    disabled,
    onValueChange: handleChange,
  };
  if (value !== undefined) {
    selectProps["value"] = String(value);
  }
  if (defaultValue !== undefined) {
    selectProps["defaultValue"] = String(defaultValue);
  }
  if (name !== undefined) {
    selectProps["name"] = name;
  }

  return (
    <Select {...(selectProps as any)}>
      <SelectTrigger
        className={cn(
          "h-9 min-w-[120px] rounded-lg border border-border bg-card text-foreground px-3 py-2 text-sm shadow-xs transition-all hover:bg-secondary/60 focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer",
          triggerClassName,
          className,
        )}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="z-50 min-w-[8rem] rounded-lg border border-border bg-popover/95 p-1 text-popover-foreground shadow-xl backdrop-blur-md">
        {options.map((opt) => (
          <SelectItem
            key={String(opt.value)}
            value={String(opt.value)}
            disabled={opt.disabled ?? false}
            className="rounded-md px-3 py-2 text-xs font-medium cursor-pointer transition-colors focus:bg-primary/10 focus:text-primary hover:bg-secondary"
          >
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
