import { useAppDispatch } from "@/store/hooks";
import { setVolumeRange } from "@/store/filterSlice";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RangeSlider } from "./RangeSlider";
import { useTranslation } from "react-i18next";

const VOLUME_MIN = 0;
const VOLUME_MAX = 1_000_000;
const VOLUME_STEP = 5_000;

interface VolumeRangeFilterProps {
  minSlider: number;
  maxSlider: number;
  setMinSlider: (value: number) => void;
  setMaxSlider: (value: number) => void;
}

export function VolumeRangeFilter({
  minSlider,
  maxSlider,
  setMinSlider,
  setMaxSlider,
}: VolumeRangeFilterProps) {
  const dispatch = useAppDispatch();
  const { t } = useTranslation();

  const handleApplyFilter = () => {
    const appliedMin = minSlider > VOLUME_MIN ? minSlider : undefined;
    const appliedMax = maxSlider < VOLUME_MAX ? maxSlider : undefined;
    dispatch(
      setVolumeRange({
        min: appliedMin,
        max: appliedMax,
      })
    );
  };

  const formatUnits = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M ${t("filters.units")}`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k ${t("filters.units")}`;
    return `${value.toLocaleString()} ${t("filters.units")}`;
  };

  return (
    <div className="space-y-2">
      <Label>{t("filters.estimatedVolume")}</Label>
      <div className="space-y-3">
        <RangeSlider
          id="volume-min"
          label={t("filters.min")}
          value={minSlider}
          min={VOLUME_MIN}
          max={VOLUME_MAX}
          step={VOLUME_STEP}
          displayValue={
            minSlider > VOLUME_MIN ? formatUnits(minSlider) : t("filters.noMinimum")
          }
          onChange={(value) => {
            let nextValue = value;
            if (nextValue > maxSlider) nextValue = maxSlider;
            setMinSlider(nextValue);
          }}
        />

        <RangeSlider
          id="volume-max"
          label={t("filters.max")}
          value={maxSlider}
          min={VOLUME_MIN}
          max={VOLUME_MAX}
          step={VOLUME_STEP}
          displayValue={
            maxSlider < VOLUME_MAX ? formatUnits(maxSlider) : t("filters.noMaximum")
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
            {t("filters.applyVolumeFilter")}
          </Button>
        </div>
      </div>
    </div>
  );
}

