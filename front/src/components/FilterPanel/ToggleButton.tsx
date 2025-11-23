import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

interface ToggleButtonProps {
  isSelected: boolean;
  onClick: () => void;
  children: ReactNode;
  className?: string;
}

export function ToggleButton({
  isSelected,
  onClick,
  children,
  className = "w-full",
}: ToggleButtonProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className={`${className} ${
        isSelected
          ? "bg-blue-100 dark:bg-blue-900 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100"
          : ""
      }`}
    >
      {children}
    </Button>
  );
}
