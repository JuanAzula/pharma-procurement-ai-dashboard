export interface ProcurementNotice {
  id: string;
  title: string;
  description?: string;
  awardDate: string;
  publicationDate?: string;
  country: string;
  countryName?: string;
  cpvCodes: string[];
  contractValue?: number;
  contractCurrency?: string;
  winningSupplier?: string;
  buyerName?: string;
  contractDuration?: string;
  contractDurationMonths?: number;
  volume?: number;
  noticeType?: string;
  tedUrl?: string;
}

export interface SearchFilters {
  dateRange?: {
    start?: string;
    end?: string;
  };
  countries?: string[];
  cpvCodes?: string[];
  suppliers?: string;
  valueRange?: {
    min?: number;
    max?: number;
  };
  volumeRange?: {
    min?: number;
    max?: number;
  };
  durationRange?: {
    min?: number;
    max?: number;
  };
}

export interface NoticeSearchRequest {
  filters: SearchFilters;
  page?: number;
  limit?: number;
  targetLanguage?: string;
}

export interface TimelineBucket {
  month: string;
  counts: Record<string, number>;
}

export interface CountryStat {
  country: string;
  contracts: number;
  totalValue: number;
  avgValue: number;
}

export interface NoticeAggregations {
  timeline: TimelineBucket[];
  countries: CountryStat[];
  dateRange: {
    min?: string;
    max?: string;
  };
}

export interface NoticeSearchResponse {
  notices: ProcurementNotice[];
  total: number;
  page: number;
  limit: number;
  aggregations: NoticeAggregations;
}

export interface TEDNoticeRaw {
  ND?: string;
  PD?: string;
  TD?: string;
  DS?: string;
  TY?: string;
  CY?: string[];
  PC?: string[];
  OC?: string[];
  RC?: string[];
  AU?: string;
  BN?: string;
  VI?: string | number | Record<string, unknown>;
  NC?: string;
  PL?: string | Record<string, unknown>;
  DU_VAL?: string;
  DU_UNIT?: string;
}

export interface TEDNoticeV3 {
  [key: string]: string | string[] | number | boolean | null | undefined;
}

export interface ExpertSearchResponse {
  notices?: TEDNoticeV3[];
  page?: number;
  limit?: number;
  total?: number;
}

export interface PublicExpertSearchRequest {
  query: string;
  fields: readonly string[];
  page?: number;
  limit?: number;
  paginationMode?: "PAGE_NUMBER" | "ITERATION";
  onlyLatestVersions?: boolean;
}
