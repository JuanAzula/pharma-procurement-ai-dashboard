import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setSuppliers } from "@/store/filterSlice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from "react-i18next";

export function SupplierFilter() {
  const dispatch = useAppDispatch();
  const { filters } = useAppSelector((state) => state.filters);
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <Label htmlFor="supplier">{t("filters.supplierName")}</Label>
      <Input
        id="supplier"
        placeholder={t("filters.supplierPlaceholder")}
        value={filters.suppliers || ""}
        onChange={(e) => dispatch(setSuppliers(e.target.value))}
      />
    </div>
  );
}

