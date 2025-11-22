import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setDateRange,
  setCountries,
  setCpvCodes,
  setSuppliers,
  setValueRange,
  clearFilters,
} from '@/store/filterSlice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { TARGET_COUNTRIES, PHARMACEUTICAL_CPV_CODES } from '@/config/ted';
import { X, Filter } from 'lucide-react';

export function FilterPanel() {
  const dispatch = useAppDispatch();
  const { filters } = useAppSelector((state) => state.filters);

  const handleCountryToggle = (countryCode: string) => {
    const currentCountries = filters.countries || [];
    const newCountries = currentCountries.includes(countryCode)
      ? currentCountries.filter((c) => c !== countryCode)
      : [...currentCountries, countryCode];
    dispatch(setCountries(newCountries));
  };

  const handleCpvToggle = (cpvCode: string) => {
    const currentCpvs = filters.cpvCodes || [];
    const newCpvs = currentCpvs.includes(cpvCode)
      ? currentCpvs.filter((c) => c !== cpvCode)
      : [...currentCpvs, cpvCode];
    dispatch(setCpvCodes(newCpvs));
  };

  const handleClearFilters = () => {
    dispatch(clearFilters());
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Date Range */}
        <div className="space-y-2">
          <Label>Date Range</Label>
          <div className="space-y-2">
            <div>
              <Label htmlFor="start-date" className="text-xs text-muted-foreground">
                Start Date
              </Label>
              <Input
                id="start-date"
                type="date"
                value={filters.dateRange?.start || ''}
                onChange={(e) =>
                  dispatch(
                    setDateRange({
                      start: e.target.value,
                      end: filters.dateRange?.end || '',
                    })
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="end-date" className="text-xs text-muted-foreground">
                End Date
              </Label>
              <Input
                id="end-date"
                type="date"
                value={filters.dateRange?.end || ''}
                onChange={(e) =>
                  dispatch(
                    setDateRange({
                      start: filters.dateRange?.start || '',
                      end: e.target.value,
                    })
                  )
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Countries */}
        <div className="space-y-2">
          <Label>Countries</Label>
          <div className="grid grid-cols-2 gap-2">
            {TARGET_COUNTRIES.map((country) => (
              <Button
                key={country.code}
                variant={
                  filters.countries?.includes(country.code)
                    ? 'default'
                    : 'outline'
                }
                size="sm"
                onClick={() => handleCountryToggle(country.code)}
                className="w-full"
              >
                {country.name}
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* CPV Codes */}
        <div className="space-y-2">
          <Label>Product Categories (CPV Codes)</Label>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {PHARMACEUTICAL_CPV_CODES.map((cpv) => (
              <Button
                key={cpv.code}
                variant={
                  filters.cpvCodes?.includes(cpv.code) ? 'default' : 'outline'
                }
                size="sm"
                onClick={() => handleCpvToggle(cpv.code)}
                className="w-full justify-start text-xs"
              >
                <span className="font-mono mr-2">{cpv.code}</span>
                <span className="truncate">{cpv.name}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Supplier Filter */}
        <div className="space-y-2">
          <Label htmlFor="supplier">Supplier Name</Label>
          <Input
            id="supplier"
            placeholder="Search by supplier..."
            value={filters.suppliers || ''}
            onChange={(e) => dispatch(setSuppliers(e.target.value))}
          />
        </div>

        <Separator />

        {/* Contract Value Range */}
        <div className="space-y-2">
          <Label>Contract Value (EUR)</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="value-min" className="text-xs text-muted-foreground">
                Min
              </Label>
              <Input
                id="value-min"
                type="number"
                placeholder="0"
                value={filters.valueRange?.min || ''}
                onChange={(e) =>
                  dispatch(
                    setValueRange({
                      min: e.target.value ? parseFloat(e.target.value) : undefined,
                      max: filters.valueRange?.max,
                    })
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="value-max" className="text-xs text-muted-foreground">
                Max
              </Label>
              <Input
                id="value-max"
                type="number"
                placeholder="No limit"
                value={filters.valueRange?.max || ''}
                onChange={(e) =>
                  dispatch(
                    setValueRange({
                      min: filters.valueRange?.min,
                      max: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  )
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Clear Filters Button */}
        <Button
          variant="outline"
          onClick={handleClearFilters}
          className="w-full"
        >
          <X className="h-4 w-4 mr-2" />
          Clear All Filters
        </Button>
      </CardContent>
    </Card>
  );
}

