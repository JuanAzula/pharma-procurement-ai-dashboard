import type { ProcurementNotice } from '@/types/ted';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { ExternalLink, Calendar, MapPin, Building, Euro } from 'lucide-react';
import { format, parseISO } from 'date-fns';

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
  if (!notice) return null;

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'PPP');
    } catch {
      return dateString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{notice.title}</DialogTitle>
          <DialogDescription>
            Notice ID: {notice.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Key Information Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Award Date</p>
                <p className="text-sm text-muted-foreground">
                  {notice.awardDate ? formatDate(notice.awardDate) : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Country</p>
                <p className="text-sm text-muted-foreground">
                  {notice.countryName || notice.country}
                </p>
              </div>
            </div>

            {notice.contractValue && (
              <div className="flex items-start gap-2">
                <Euro className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Contract Value</p>
                  <p className="text-sm text-muted-foreground">
                    {notice.contractCurrency || 'EUR'}{' '}
                    {notice.contractValue.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {notice.winningSupplier && (
              <div className="flex items-start gap-2">
                <Building className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Winning Supplier</p>
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
              <h4 className="text-sm font-semibold mb-2">Description</h4>
              <p className="text-sm text-muted-foreground">{notice.description}</p>
            </div>
          )}

          {/* CPV Codes */}
          {notice.cpvCodes && notice.cpvCodes.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2">CPV Codes</h4>
              <div className="flex flex-wrap gap-2">
                {notice.cpvCodes.slice(0, 10).map((code) => (
                  <Badge key={code} variant="secondary">
                    {code}
                  </Badge>
                ))}
                {notice.cpvCodes.length > 10 && (
                  <Badge variant="outline">
                    +{notice.cpvCodes.length - 10} more
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
                <p className="font-medium">Buyer</p>
                <p className="text-muted-foreground">{notice.buyerName}</p>
              </div>
            )}

            {notice.contractDuration && (
              <div>
                <p className="font-medium">Duration</p>
                <p className="text-muted-foreground">{notice.contractDuration}</p>
              </div>
            )}

            {notice.volume && (
              <div>
                <p className="font-medium">Volume</p>
                <p className="text-muted-foreground">{notice.volume}</p>
              </div>
            )}

            {notice.noticeType && (
              <div>
                <p className="font-medium">Notice Type</p>
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
                onClick={() => window.open(notice.tedUrl, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on TED Website
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

