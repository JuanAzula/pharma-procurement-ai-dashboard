import { useAppDispatch } from "@/store/hooks";
import { setValueRange } from "@/store/filterSlice";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RangeSlider } from "./RangeSlider";
import { useTranslation } from "react-i18next";

const VALUE_MIN = 0;
const VALUE_MAX = 10_000_000;
const VALUE_STEP = 10_000;

interface ValueRangeFilterProps {
  minSlider: number;
  maxSlider: number;
  setMinSlider: (value: number) => void;
  setMaxSlider: (value: number) => void;
}

export function ValueRangeFilter({
  minSlider,
  maxSlider,
  setMinSlider,
  setMaxSlider,
}: ValueRangeFilterProps) {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const handleApplyFilter = () => {
    const appliedMin = minSlider > VALUE_MIN ? minSlider : undefined;
    const appliedMax = maxSlider < VALUE_MAX ? maxSlider : undefined;
    dispatch(
      setValueRange({
        min: appliedMin,
        max: appliedMax,
      })
    );
  };

  return (
    <div className="space-y-2">
      <Label>{t("filters.contractValue")}</Label>
      <div className="space-y-3">
        <RangeSlider
          id="value-min"
          label={t("filters.min")}
          value={minSlider}
          min={VALUE_MIN}
          max={VALUE_MAX}
          step={VALUE_STEP}
          displayValue={
            minSlider > VALUE_MIN
              ? `€${minSlider.toLocaleString()}`
              : t("filters.noMinimum")
          }
          onChange={(value) => {
            let val = value;
            if (val > maxSlider) val = maxSlider;
            setMinSlider(val);
          }}
        />

        <RangeSlider
          id="value-max"
          label={t("filters.max")}
          value={maxSlider}
          min={VALUE_MIN}
          max={VALUE_MAX}
          step={VALUE_STEP}
          displayValue={
            maxSlider < VALUE_MAX
              ? `€${maxSlider.toLocaleString()}`
              : t("filters.noMaximum")
          }
          onChange={(value) => {
            let val = value;
            if (val < minSlider) val = minSlider;
            setMaxSlider(val);
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
            {t("filters.applyValueFilter")}
          </Button>
        </div>
      </div>
    </div>
  );
}

