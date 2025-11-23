import { useAppDispatch } from "@/store/hooks";
import { setDurationRange } from "@/store/filterSlice";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RangeSlider } from "./RangeSlider";
import { useTranslation } from "react-i18next";

const DURATION_MIN = 0;
const DURATION_MAX = 60;
const DURATION_STEP = 1;

interface DurationRangeFilterProps {
  minSlider: number;
  maxSlider: number;
  setMinSlider: (value: number) => void;
  setMaxSlider: (value: number) => void;
}

export function DurationRangeFilter({
  minSlider,
  maxSlider,
  setMinSlider,
  setMaxSlider,
}: DurationRangeFilterProps) {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const handleApplyFilter = () => {
    const appliedMin = minSlider > DURATION_MIN ? minSlider : undefined;
    const appliedMax = maxSlider < DURATION_MAX ? maxSlider : undefined;
    dispatch(
      setDurationRange({
        min: appliedMin,
        max: appliedMax,
      })
    );
  };

  return (
    <div className="space-y-2">
      <Label>{t("filters.contractDuration")}</Label>
      <div className="space-y-3">
        <RangeSlider
          id="duration-min"
          label={t("filters.min")}
          value={minSlider}
          min={DURATION_MIN}
          max={DURATION_MAX}
          step={DURATION_STEP}
          displayValue={
            minSlider > DURATION_MIN
              ? `${minSlider.toFixed(0)} ${t("filters.months")}`
              : t("filters.noMinimum")
          }
          onChange={(value) => {
            let nextValue = value;
            if (nextValue > maxSlider) nextValue = maxSlider;
            setMinSlider(nextValue);
          }}
        />

        <RangeSlider
          id="duration-max"
          label={t("filters.max")}
          value={maxSlider}
          min={DURATION_MIN}
          max={DURATION_MAX}
          step={DURATION_STEP}
          displayValue={
            maxSlider < DURATION_MAX
              ? `${maxSlider.toFixed(0)} ${t("filters.months")}`
              : t("filters.noMaximum")
          }
          onChange={(value) => {
            let nextValue = value;
            if (nextValue < minSlider) nextValue = minSlider;
            setMaxSlider(nextValue);
          }}
        />

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={handleApplyFilter}
          >
            {t("filters.applyDurationFilter")}
          </Button>
        </div>
      </div>
    </div>
  );
}

