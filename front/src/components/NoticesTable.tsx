import { useState, useEffect } from "react";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { setCurrentPage } from "@/store/filterSlice";
import {
  selectDisplayedNotices,
  selectPaginationInfo,
} from "@/store/paginationSlice";
import type { ProcurementNotice } from "@/types/ted";
import { useTranslateNoticesMutation } from "@/services/tedApi";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NoticeDetailDialog } from "./NoticeDetailDialog";
import { format, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getDateLocale } from "@/lib/utils";

interface NoticesTableProps {
  isLoading?: boolean;
}

export function NoticesTable({ isLoading }: NoticesTableProps) {
  const dispatch = useAppDispatch();
  const data = useAppSelector(selectDisplayedNotices);
  const { pageRangeStart, pageRangeEnd } = useAppSelector(selectPaginationInfo);
  const currentPage = useAppSelector((state) => state.filters.currentPage);
  const { t, i18n } = useTranslation();
  
  const [translateNotices] = useTranslateNoticesMutation();
  const [translatedData, setTranslatedData] = useState<Record<string, { title: string; description: string }>>({});

  // Effect to trigger translation when data or language changes
  useEffect(() => {
    const fetchTranslations = async () => {
      if (data.length === 0) return;

      // Identify items that need translation (or re-translation if lang changed)
      // For simplicity, we just re-translate everything on page load/change
      // Optimization: check if we already have this lang cached locally? 
      // For now, rely on backend Redis cache.
      
      const itemsToTranslate = data.map(n => ({
        id: n.id,
        title: n.title,
        description: n.description
      }));

      try {
        const result = await translateNotices({
          items: itemsToTranslate,
          targetLanguage: i18n.language
        }).unwrap();
        
        setTranslatedData(result);
      } catch {
        // Fail silently if translation fetch fails
      }
    };

    fetchTranslations();
  }, [data, i18n.language, translateNotices]);

  const handlePageChange = (page: number) => {
    dispatch(setCurrentPage(page));
  };
  const [selectedNotice, setSelectedNotice] =
    useState<ProcurementNotice | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleRowClick = (notice: ProcurementNotice) => {
    // Merge translation into selected notice for the dialog
    const translated = translatedData[notice.id];
    const noticeWithTranslation = translated ? {
      ...notice,
      title: translated.title,
      description: translated.description
    } : notice;

    setSelectedNotice(noticeWithTranslation);
    setDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "PP", {
        locale: getDateLocale(i18n.language),
      });
    } catch {
      return dateString;
    }
  };

  const formatValue = (value?: number, currency?: string) => {
    if (!value) return "N/A";
    return `${currency || "EUR"} ${value.toLocaleString()}`;
  };

  const formatDuration = (notice: ProcurementNotice) => {
    if (notice.contractDuration) return notice.contractDuration;
    if (notice.contractDurationMonths != null) {
      return `${notice.contractDurationMonths.toFixed(1)} mo`;
    }
    return "N/A";
  };

  const formatVolume = (volume?: number) => {
    if (volume == null) return "N/A";
    if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(1)}M`;
    if (volume >= 1_000) return `${(volume / 1_000).toFixed(1)}k`;
    return volume.toLocaleString();
  };

  const hasRange = pageRangeStart > 0 && pageRangeEnd > 0;
  const rangeLabel = hasRange
    ? t("pagination.showingRange", { start: pageRangeStart, end: pageRangeEnd })
    : data.length === 0
    ? t("pagination.noResults")
    : t("pagination.showingResults", { count: data.length });

  if (isLoading) {
    return (
      <div className="h-[104vh] rounded-md border p-4 space-y-2 overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="h-[104vh] rounded-md border overflow-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10">
            <TableRow>
              <TableHead>{t("table.awardDate")}</TableHead>
              <TableHead>{t("table.country")}</TableHead>
              <TableHead className="max-w-md">{t("table.title")}</TableHead>
              <TableHead>{t("table.contractValue")}</TableHead>
              <TableHead>{t("table.supplier")}</TableHead>
              <TableHead>{t("table.cpvCodes")}</TableHead>
              <TableHead>{t("table.duration")}</TableHead>
              <TableHead>{t("table.volume")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((notice) => {
              const translated = translatedData[notice.id];
              const displayTitle = translated?.title || notice.title;
              
              return (
              <TableRow
                key={notice.id}
                onClick={() => handleRowClick(notice)}
                className="cursor-pointer"
              >
                <TableCell className="whitespace-nowrap">
                  {notice.awardDate ? formatDate(notice.awardDate) : "N/A"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {notice.countryName || notice.country}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-md">
                  <div className="truncate" title={displayTitle}>
                    {displayTitle}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatValue(notice.contractValue, notice.contractCurrency)}
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="truncate">
                    {notice.winningSupplier || "N/A"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {notice.cpvCodes.slice(0, 2).map((code, index) => (
                      <Badge
                        key={`${notice.id}-${code}-${index}`}
                        variant="secondary"
                        className="text-xs"
                      >
                        {code}
                      </Badge>
                    ))}
                    {notice.cpvCodes.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{notice.cpvCodes.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>{formatDuration(notice)}</TableCell>
                <TableCell>{formatVolume(notice.volume)}</TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">{rangeLabel}</p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            {t("pagination.previous")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={data.length === 0}
          >
            {t("pagination.next")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <NoticeDetailDialog
        notice={selectedNotice}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
