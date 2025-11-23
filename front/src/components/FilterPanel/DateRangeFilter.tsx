import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setDateRange } from "@/store/filterSlice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

export function DateRangeFilter() {
  const dispatch = useAppDispatch();
  const { filters } = useAppSelector((state) => state.filters);
  const { t } = useTranslation();

  const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
  const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);

  const activeStart = filters.dateRange?.start || "";
  const activeEnd = filters.dateRange?.end || "";

  const minEndDate = useMemo(() => activeStart || undefined, [activeStart]);
  const maxStartDate = useMemo(() => activeEnd || undefined, [activeEnd]);

  const handleStartChange = (value: string) => {
    const nextEnd = value && activeEnd && value > activeEnd ? value : activeEnd;
    dispatch(
      setDateRange({
        start: value,
        end: nextEnd,
      })
    );
  };

  const handleEndChange = (value: string) => {
    const nextStart =
      activeStart && value && activeStart > value ? value : activeStart;
    dispatch(
      setDateRange({
        start: nextStart,
        end: value,
      })
    );
  };

  return (
    <div className="space-y-2">
      <Label>{t("filters.dateFilters")}</Label>
      <div className="space-y-2">
        <div>
          <Label htmlFor="start-date" className="text-xs text-muted-foreground">
            {t("filters.awardDate")}
          </Label>
          <Input
            id="start-date"
            type="date"
            value={activeStart}
            max={maxStartDate}
            onClick={(e) => {
              const input = e.currentTarget as HTMLInputElement;
              if (isStartPickerOpen) {
                input.blur();
              } else {
                input.showPicker?.();
                setIsStartPickerOpen(true);
              }
            }}
            onBlur={() => setIsStartPickerOpen(false)}
            onChange={(e) => handleStartChange(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="end-date" className="text-xs text-muted-foreground">
            {t("filters.awardDateEnd")}
          </Label>
          <Input
            id="end-date"
            type="date"
            value={activeEnd}
            min={minEndDate}
            onClick={(e) => {
              const input = e.currentTarget as HTMLInputElement;
              if (isEndPickerOpen) {
                input.blur();
              } else {
                input.showPicker?.();
                setIsEndPickerOpen(true);
              }
            }}
            onBlur={() => setIsEndPickerOpen(false)}
            onChange={(e) => handleEndChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

