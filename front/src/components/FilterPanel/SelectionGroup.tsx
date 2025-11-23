import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SelectionGroupProps {
  selectedCount: number;
  onSelectAll: () => void;
  onUnselectAll: () => void;
}

export function SelectionGroup({
  selectedCount,
  onSelectAll,
  onUnselectAll,
}: SelectionGroupProps) {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center gap-1.5">
      {selectedCount > 0 && (
        <span className="text-xs text-muted-foreground">
          {selectedCount}
        </span>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={onSelectAll}
        title={t("filters.selectAll")}
      >
        <Check className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={onUnselectAll}
        title={t("filters.unselectAll")}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

