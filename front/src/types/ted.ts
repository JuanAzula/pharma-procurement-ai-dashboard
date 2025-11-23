// TED API Types

export interface CPVCode {
  code: string;
  name: string;
}

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

export interface SearchFilters {
  dateRange?: {
    start: string;
    end: string;
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
  targetLanguage?: string;
}

// V3 API Request/Response Types

export interface PublicExpertSearchRequest {
  query: string; // Expert search query (required, >= 1 character)
  fields: string[]; // Field names to return (required, >= 1 unique item)
  page?: number; // Page number (>= 1, default: 1)
  limit?: number; // Results per page (>= 0, max: 250, default: 50)
  scope?: string; // Search scope
  paginationMode?: "PAGE_NUMBER" | "ITERATION"; // Correct enum values
  checkQuerySyntax?: boolean;
  onlyLatestVersions?: boolean;
  iterationNextToken?: string; // For scroll/iteration mode
}

export interface ExpertSearchResponse {
  notices: TEDNoticeV3[];
  page?: number;
  limit?: number;
  total?: number;
  iterationNextToken?: string; // For scroll mode
}

export interface TEDNoticeV3 {
  [key: string]: string | string[] | number | boolean | null | undefined; // Dynamic fields based on requested fields
}

// Legacy type for backwards compatibility
export interface TEDSearchParams {
  q?: string;
  "fields[]"?: string[];
  "cfc[]"?: string[]; // Country filter codes
  "cpv[]"?: string[]; // CPV codes
  "pc[]"?: string[]; // Publication codes/types
  pbd?: string; // Publication begin date (YYYY-MM-DD)
  ped?: string; // Publication end date (YYYY-MM-DD)
  pageNum?: number;
  pageSize?: number;
  reverseOrder?: boolean;
  scope?: number;
}

// Legacy API response (deprecated)
export interface TEDApiResponse {
  total: number;
  page: number;
  pageSize: number;
  notices: TEDNoticeRaw[];
}

export interface TEDNoticeRaw {
  ND?: string; // Notice ID
  PD?: string; // Publication date
  TD?: string; // Title description
  OJ?: string; // Official journal reference
  TY?: string; // Type
  NC?: string; // Notice code
  PR?: string; // Procedure
  PL?: string; // Place (country)
  CY?: string[]; // Countries
  OC?: string[]; // Original CPV codes
  PC?: string[]; // CPV codes
  RC?: string[]; // Related CPVs
  IA?: string; // ISO area code
  AA?: string; // Award criteria
  DT?: string; // Document type
  AC?: string; // Award criteria
  TC?: string; // Type of contract
  VI?: string | number | Record<string, unknown>; // Value information
  LE?: string | Record<string, unknown>; // Legal basis
  AU?: string; // Authority
}
