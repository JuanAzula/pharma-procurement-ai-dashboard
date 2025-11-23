import { useMemo, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clearFilters } from "@/store/filterSlice";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PHARMACEUTICAL_CPV_CODES } from "@/config/ted";
import type { CPVCode } from "@/types/ted";
import { X } from "lucide-react";
import { FilterHeader } from "./FilterHeader";
import { DateRangeFilter } from "./DateRangeFilter";
import { CountryFilter } from "./CountryFilter";
import { CpvCodeFilter } from "./CpvCodeFilter";
import { SupplierFilter } from "./SupplierFilter";
import { ValueRangeFilter } from "./ValueRangeFilter";
import { DurationRangeFilter } from "./DurationRangeFilter";
import { VolumeRangeFilter } from "./VolumeRangeFilter";

export function FilterPanel() {
  const dispatch = useAppDispatch();
  const { filters } = useAppSelector((state) => state.filters);
  const { t } = useTranslation();

  const cpvOptions: CPVCode[] = useMemo(
    () =>
      PHARMACEUTICAL_CPV_CODES.map(({ code }) => ({
        code,
        name: t(`cpvCodes.${code}`),
      })),
    []
  );
  const cpvLoading = false;

  const VALUE_MIN = 0;
  const VALUE_MAX = 10_000_000;
  const DURATION_MIN = 0;
  const DURATION_MAX = 60;
  const VOLUME_MIN = 0;
  const VOLUME_MAX = 1_000_000;
  const [minSlider, setMinSlider] = useState<number>(
    filters.valueRange?.min ?? VALUE_MIN
  );
  const [maxSlider, setMaxSlider] = useState<number>(
    filters.valueRange?.max ?? VALUE_MAX
  );
  const [durationMinSlider, setDurationMinSlider] = useState<number>(
    filters.durationRange?.min ?? DURATION_MIN
  );
  const [durationMaxSlider, setDurationMaxSlider] = useState<number>(
    filters.durationRange?.max ?? DURATION_MAX
  );
  const [volumeMinSlider, setVolumeMinSlider] = useState<number>(
    filters.volumeRange?.min ?? VOLUME_MIN
  );
  const [volumeMaxSlider, setVolumeMaxSlider] = useState<number>(
    filters.volumeRange?.max ?? VOLUME_MAX
  );

  const handleClearFilters = () => {
    dispatch(clearFilters());
    setMinSlider(VALUE_MIN);
    setMaxSlider(VALUE_MAX);
    setDurationMinSlider(DURATION_MIN);
    setDurationMaxSlider(DURATION_MAX);
    setVolumeMinSlider(VOLUME_MIN);
    setVolumeMaxSlider(VOLUME_MAX);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <FilterHeader />
      </CardHeader>
      <CardContent className="space-y-6">
        <DateRangeFilter />

        <Separator />

        <CountryFilter />

        <Separator />

        <CpvCodeFilter cpvOptions={cpvOptions} cpvLoading={cpvLoading} />

        <Separator />

        <SupplierFilter />

        <Separator />

        <ValueRangeFilter
          minSlider={minSlider}
          maxSlider={maxSlider}
          setMinSlider={setMinSlider}
          setMaxSlider={setMaxSlider}
        />

        <Separator />

        <DurationRangeFilter
          minSlider={durationMinSlider}
          maxSlider={durationMaxSlider}
          setMinSlider={setDurationMinSlider}
          setMaxSlider={setDurationMaxSlider}
        />

        <Separator />

        <VolumeRangeFilter
          minSlider={volumeMinSlider}
          maxSlider={volumeMaxSlider}
          setMinSlider={setVolumeMinSlider}
          setMaxSlider={setVolumeMaxSlider}
        />

        <Separator />

        {/* Clear Filters Button */}
        <Button
          variant="outline"
          onClick={handleClearFilters}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          {t("filters.clearAll")}
        </Button>
      </CardContent>
    </Card>
  );
}
