import { CardTitle } from "@/components/ui/card";
import { Filter } from "lucide-react";
import { useTranslation } from "react-i18next";

export function FilterHeader() {
  const { t } = useTranslation();
  return (
    <CardTitle className="flex items-center gap-2">
      <Filter className="h-5 w-5" />
      {t("filters.title")}
    </CardTitle>
  );
}

