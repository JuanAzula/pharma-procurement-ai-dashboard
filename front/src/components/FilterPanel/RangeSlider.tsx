import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface RangeSliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (value: number) => void;
}

export function RangeSlider({
  id,
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
}: RangeSliderProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    
    return () => observer.disconnect();
  }, []);

  // Calculate percentage for gradient
  const percentage = ((value - min) / (max - min)) * 100;
  
  // Colors matching ToggleButton selected state
  const filledColor = isDark ? 'rgb(30, 58, 138)' : 'rgb(59, 130, 246)'; // dark:blue-900 : blue-500
  const unfilledColor = isDark ? 'rgba(73, 97, 135, 1)' : 'rgb(226, 232, 240)'; // dark:slate-800 : slate-200
  
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <Label htmlFor={id} className="text-xs text-muted-foreground">
          {label}
        </Label>
        <span className="text-xs text-muted-foreground">{displayValue}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        style={{
          background: `linear-gradient(to right, ${filledColor} 0%, ${filledColor} ${percentage}%, ${unfilledColor} ${percentage}%, ${unfilledColor} 100%)`
        }}
        className={cn(
          "w-full cursor-pointer appearance-none focus-visible:outline-none",
          "h-2 rounded-full",
          "border border-blue-200 dark:border-blue-700",
          "focus-visible:ring-2 focus-visible:ring-blue-400 dark:focus-visible:ring-blue-600",
          "focus-visible:ring-offset-1 focus-visible:ring-offset-background",
          "[&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent",
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4",
          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-500 dark:[&::-webkit-slider-thumb]:bg-blue-300",
          "[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-blue-900",
          "[&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:bg-blue-600 dark:[&::-webkit-slider-thumb]:hover:bg-blue-400",
          "[&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent",
          "[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4",
          "[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-500 dark:[&::-moz-range-thumb]:bg-blue-300",
          "[&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white dark:[&::-moz-range-thumb]:border-blue-900",
          "[&::-moz-range-thumb]:shadow-md"
        )}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

