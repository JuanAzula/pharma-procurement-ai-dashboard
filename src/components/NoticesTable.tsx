import { useState } from 'react';
import type { ProcurementNotice } from '@/types/ted';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NoticeDetailDialog } from './NoticeDetailDialog';
import { format, parseISO } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NoticesTableProps {
  data: ProcurementNotice[];
  isLoading?: boolean;
  currentPage: number;
  onPageChange: (page: number) => void;
}

export function NoticesTable({
  data,
  isLoading,
  currentPage,
  onPageChange,
}: NoticesTableProps) {
  const [selectedNotice, setSelectedNotice] = useState<ProcurementNotice | null>(
    null
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleRowClick = (notice: ProcurementNotice) => {
    setSelectedNotice(notice);
    setDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'PP');
    } catch {
      return dateString;
    }
  };

  const formatValue = (value?: number, currency?: string) => {
    if (!value) return 'N/A';
    return `${currency || 'EUR'} ${value.toLocaleString()}`;
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 bg-muted animate-pulse rounded-lg"
          />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          No procurement notices found. Try adjusting your filters.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Award Date</TableHead>
              <TableHead>Country</TableHead>
              <TableHead className="max-w-md">Title</TableHead>
              <TableHead>Contract Value</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>CPV Codes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((notice) => (
              <TableRow
                key={notice.id}
                onClick={() => handleRowClick(notice)}
                className="cursor-pointer"
              >
                <TableCell className="whitespace-nowrap">
                  {notice.awardDate ? formatDate(notice.awardDate) : 'N/A'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {notice.countryName || notice.country}
                  </Badge>
                </TableCell>
                <TableCell className="max-w-md">
                  <div className="truncate" title={notice.title}>
                    {notice.title}
                  </div>
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatValue(notice.contractValue, notice.contractCurrency)}
                </TableCell>
                <TableCell className="max-w-xs">
                  <div className="truncate">
                    {notice.winningSupplier || 'N/A'}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {notice.cpvCodes.slice(0, 2).map((code) => (
                      <Badge key={code} variant="secondary" className="text-xs">
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-muted-foreground">
          Showing {data.length} results
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={data.length < 50}
          >
            Next
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

