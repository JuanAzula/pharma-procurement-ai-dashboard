import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setCountries } from "@/store/filterSlice";
import { Label } from "@/components/ui/label";
import { TARGET_COUNTRIES } from "@/config/ted";
import { SelectionGroup } from "./SelectionGroup";
import { ToggleButton } from "./ToggleButton";
import { useTranslation } from "react-i18next";

export function CountryFilter() {
  const dispatch = useAppDispatch();
  const { filters } = useAppSelector((state) => state.filters);
    const { t } = useTranslation();
  

  const handleCountryToggle = (countryCode: string) => {
    const currentCountries = filters.countries || [];
    const newCountries = currentCountries.includes(countryCode)
      ? currentCountries.filter((c) => c !== countryCode)
      : [...currentCountries, countryCode];
    dispatch(setCountries(newCountries));
  };

  const handleSelectAll = () => {
    const allCountryCodes = TARGET_COUNTRIES.map((c) => c.code);
    dispatch(setCountries(allCountryCodes));
  };

  const handleUnselectAll = () => {
    dispatch(setCountries([]));
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label>{t("filters.countries")}</Label>
        <SelectionGroup
          selectedCount={filters.countries?.length || 0}
          onSelectAll={handleSelectAll}
          onUnselectAll={handleUnselectAll}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {TARGET_COUNTRIES.map((country) => {
          const isSelected = filters.countries?.includes(country.code) ?? false;
          return (
            <ToggleButton
              key={country.code}
              isSelected={isSelected}
              onClick={() => handleCountryToggle(country.code)}
            >
              {t(`countries.${country.name.toLowerCase()}`)}
            </ToggleButton>
          );
        })}
      </div>
    </div>
  );
}
