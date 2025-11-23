import type { ProcurementNotice } from "@/types/ted";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { cn, getDateLocale } from "@/lib/utils";
import { useAppSelector } from "@/store/hooks";
import { ExternalLink, Calendar, MapPin, Building, Euro } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";

interface NoticeDetailDialogProps {
  notice: ProcurementNotice | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NoticeDetailDialog({
  notice,
  open,
  onOpenChange,
}: NoticeDetailDialogProps) {
  const { resolvedTheme } = useAppSelector((state) => state.theme);
  const { t, i18n } = useTranslation();

  if (!notice) return null;

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "PPP", {
        locale: getDateLocale(i18n.language),
      });
    } catch {
      return dateString;
    }
  };

  const formatDuration = () => {
    if (notice.contractDuration) return notice.contractDuration;
    if (notice.contractDurationMonths != null) {
      return `${notice.contractDurationMonths.toFixed(1)} ${t("notice.months", "months")}`;
    }
    return "N/A";
  };

  const formatVolume = () => {
    if (notice.volume == null) return "N/A";
    if (notice.volume >= 1_000_000) {
      return `${(notice.volume / 1_000_000).toFixed(1)} million ${t("notice.units", "units")}`;
    }
    if (notice.volume >= 1_000) {
      return `${(notice.volume / 1_000).toFixed(1)}k ${t("notice.units", "units")}`;
    }
    return `${notice.volume.toLocaleString()} ${t("notice.units", "units")}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "max-w-3xl max-h-[80vh] overflow-y-auto",
          resolvedTheme === "dark"
            ? "bg-slate-900 text-white"
            : "bg-white text-slate-900"
        )}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">{notice.title}</DialogTitle>
          <DialogDescription>{t("notice.id")}: {notice.id}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Key Information Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">{t("notice.awardDate")}</p>
                <p className="text-sm text-muted-foreground">
                  {notice.awardDate ? formatDate(notice.awardDate) : "N/A"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">{t("notice.country")}</p>
                <p className="text-sm text-muted-foreground">
                  {notice.countryName || notice.country}
                </p>
              </div>
            </div>

            {notice.contractValue && (
              <div className="flex items-start gap-2">
                <Euro className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{t("notice.contractValue")}</p>
                  <p className="text-sm text-muted-foreground">
                    {notice.contractCurrency || "EUR"}{" "}
                    {notice.contractValue.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {notice.winningSupplier && (
              <div className="flex items-start gap-2">
                <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{t("notice.winningSupplier")}</p>
                  <p className="text-sm text-muted-foreground">
                    {notice.winningSupplier}
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Description */}
          {notice.description && (
            <div>
              <h4 className="text-sm font-semibold mb-2">{t("notice.description")}</h4>
              <p className="text-sm text-muted-foreground">
                {notice.description}
              </p>
            </div>
          )}

          {/* CPV Codes */}
          {notice.cpvCodes && notice.cpvCodes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">{t("notice.cpvCodes")}</h4>
              <div className="flex flex-wrap gap-2">
                {notice.cpvCodes.slice(0, 10).map((code, index) => (
                  <Badge
                    key={`${notice.id}-cpv-${code}-${index}`}
                    variant="secondary"
                  >
                    {code}
                  </Badge>
                ))}
                {notice.cpvCodes.length > 10 && (
                  <Badge variant="outline">
                    +{notice.cpvCodes.length - 10} {t("notice.more")}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Additional Information */}
          <Separator />

          <div className="grid grid-cols-2 gap-4 text-sm">
            {notice.buyerName && (
              <div>
                <p className="font-medium">{t("notice.buyer")}</p>
                <p className="text-muted-foreground">{notice.buyerName}</p>
              </div>
            )}

            {(notice.contractDuration ||
              notice.contractDurationMonths != null) && (
              <div>
                <p className="font-medium">{t("notice.duration")}</p>
                <p className="text-muted-foreground">{formatDuration()}</p>
              </div>
            )}

            {notice.volume != null && (
              <div>
                <p className="font-medium">{t("notice.volume")}</p>
                <p className="text-muted-foreground">{formatVolume()}</p>
              </div>
            )}

            {notice.noticeType && (
              <div>
                <p className="font-medium">{t("notice.noticeType")}</p>
                <p className="text-muted-foreground">{notice.noticeType}</p>
              </div>
            )}
          </div>

          {/* Link to TED */}
          {notice.tedUrl && (
            <>
              <Separator />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(notice.tedUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                {t("notice.viewOnTed")}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
