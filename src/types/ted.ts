// TED API Types

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
  contractDuration?: string;
  volume?: number;
  buyerName?: string;
  noticeType?: string;
  tedUrl?: string;
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
}

export interface TEDSearchParams {
  q?: string;
  'fields[]'?: string[];
  'cfc[]'?: string[]; // Country filter codes
  'cpv[]'?: string[]; // CPV codes
  'pc[]'?: string[]; // Publication codes/types
  'pbd'?: string; // Publication begin date (YYYY-MM-DD)
  'ped'?: string; // Publication end date (YYYY-MM-DD)
  'pageNum'?: number;
  'pageSize'?: number;
  reverseOrder?: boolean;
  scope?: number;
}

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
  VI?: any; // Value information
  LE?: any; // Legal basis
  AU?: string; // Authority
}

