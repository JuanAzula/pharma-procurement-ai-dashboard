import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCpvCodes } from "@/store/filterSlice";
import { Label } from "@/components/ui/label";
import type { CPVCode } from "@/types/ted";
import { SelectionGroup } from "./SelectionGroup";
import { ToggleButton } from "./ToggleButton";
import { useTranslation } from "react-i18next";

interface CpvCodeFilterProps {
  cpvOptions: CPVCode[];
  cpvLoading: boolean;
}

export function CpvCodeFilter({ cpvOptions, cpvLoading }: CpvCodeFilterProps) {
  const dispatch = useAppDispatch();
  const { filters } = useAppSelector((state) => state.filters);
  const { t } = useTranslation();

  const handleCpvToggle = (cpvCode: string) => {
    const currentCpvs = filters.cpvCodes || [];
    const newCpvs = currentCpvs.includes(cpvCode)
      ? currentCpvs.filter((c) => c !== cpvCode)
      : [...currentCpvs, cpvCode];
    dispatch(setCpvCodes(newCpvs));
  };

  const handleSelectAll = () => {
    const allCpvs = cpvOptions.map((c) => c.code);
    dispatch(setCpvCodes(allCpvs));
  };

  const handleUnselectAll = () => {
    dispatch(setCpvCodes([]));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{t("filters.cpvCodesLabel")}</Label>
        <SelectionGroup
          selectedCount={filters.cpvCodes?.length || 0}
          onSelectAll={handleSelectAll}
          onUnselectAll={handleUnselectAll}
        />
      </div>
      <div className="space-y-1 max-h-48 overflow-y-auto">
        {cpvLoading && cpvOptions.length === 0 && (
          <p className="text-xs text-muted-foreground">
            {t("filters.loadingCpvCodes")}
          </p>
        )}
        {!cpvLoading &&
          cpvOptions.map((cpv) => {
            const isSelected = filters.cpvCodes?.includes(cpv.code) ?? false;
            return (
              <ToggleButton
                key={cpv.code}
                isSelected={isSelected}
                onClick={() => handleCpvToggle(cpv.code)}
                className="w-full justify-start text-xs"
              >
                <span className="font-mono mr-2">{cpv.code}</span>
                <span className="truncate">{cpv.name}</span>
              </ToggleButton>
            );
          })}
      </div>
    </div>
  );
}

