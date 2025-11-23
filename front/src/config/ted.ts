// TED API Configuration

const BACKEND_API_BASE_URL =
  import.meta.env.VITE_BACKEND_API_URL ||
  (import.meta.env.DEV ? "/api/backend" : "/api/backend");

export const TED_API_BASE_URL = BACKEND_API_BASE_URL;

// Target countries
// V3 API uses ISO 3166-1 alpha-3 codes (3-letter country codes)
export const TARGET_COUNTRIES = [
  { code: "HUN", name: "Hungary" },
  { code: "DEU", name: "Germany" }, // was DE
  { code: "ITA", name: "Italy" },
  { code: "POL", name: "Poland" }, // was PL
] as const;

export const COUNTRY_MAP: Record<string, string> = {
  BEL: "Belgium",
  BGR: "Bulgaria",
  CHE: "Switzerland",
  CZE: "Czech Republic",
  DEU: "Germany",
  EST: "Estonia",
  FRA: "France",
  HRV: "Croatia",
  HUN: "Hungary",
  ITA: "Italy",
  NLD: "Netherlands",
  NOR: "Norway",
  POL: "Poland",
  SWE: "Sweden",
  // Legacy 2-letter codes for backwards compatibility
  BE: "Belgium",
  BG: "Bulgaria",
  CH: "Switzerland",
  CZ: "Czech Republic",
  DE: "Germany",
  EE: "Estonia",
  FR: "France",
  HR: "Croatia",
  HU: "Hungary",
  IT: "Italy",
  NL: "Netherlands",
  NO: "Norway",
  PL: "Poland",
  SE: "Sweden",
};

// V3 API Field Names - fields to request in search response
// Note: v3 API uses descriptive field names, not the old short codes
export const TED_V3_FIELDS = [
  "notice-identifier", // Notice ID (was ND)
  "publication-date", // Publication Date (was PD)
  "title-lot", // Lot title
  "title-proc", // Procedure title
  "description-lot", // Lot description
  "description-proc", // Procedure description
  "buyer-name", // Buyer/Authority name (was AU)
  "buyer-country", // Buyer country
  "place-of-performance-country-lot", // Country where work is performed
  "classification-cpv", // CPV classification codes (was PC/OC/RC)
  "notice-type", // Type of notice (was TY)
  "contract-nature", // Nature of contract
  "result-value-lot", // Contract value for lot results
  "winner-name", // Name of winning supplier
  "BT-157-LotsGroup", // Estimated value
  "BT-27-Lot", // Estimated value lot
] as const;

// CPV codes for pharmaceutical products
// Based on Common Procurement Vocabulary (CPV)
export const PHARMACEUTICAL_CPV_CODES = [
  // General pharmaceutical products
  { code: "33600000", name: "Pharmaceutical products", group: "General" },
  { code: "33651000", name: "Pharmaceutical preparations", group: "General" },

  // Antineoplastic agents (Abiraterone)
  { code: "33651600", name: "Antineoplastic agents", group: "Abiraterone" },

  // Cardiovascular medicines (Eplerenone)
  {
    code: "33631600",
    name: "Cardiovascular system drugs",
    group: "Eplerenone",
  },

  { code: "33652300", name: "Immunosuppressants agents", group: "Pomalidomide" },
] as const;

// Search keywords for specific drugs
export const DRUG_KEYWORDS = [
  "Abiraterone",
  "Eplerenone",
  "Pomalidomide",
] as const;

// Notice types - focusing on contract awards
export const NOTICE_TYPES = {
  CONTRACT_AWARD: "7", // Contract award notice
  CONTRACT_NOTICE: "2", // Contract notice
  PRIOR_INFORMATION: "1", // Prior information notice
} as const;

// V3 API Limits and Pagination
export const DEFAULT_PAGE_SIZE = 20; // Number of items to display
export const FETCH_PAGE_SIZE = 250; // Number of items to fetch from API (buffer for display)
export const MAX_PAGE_SIZE = 250; // V3 API maximum
export const MAX_RETRIEVABLE_NOTICES = 15000; // In pagination mode
export const MAX_FIELDS_PER_PAGE = 10000; // notices × fields

// Pagination modes (correct enum values from API)
export const PAGINATION_MODE = {
  PAGE_NUMBER: "PAGE_NUMBER", // Stateless pagination, with limits
  ITERATION: "ITERATION", // Scroll mode, no limit on total notices
} as const;

// Date range defaults (last 2 years)
export const DEFAULT_DATE_RANGE = {
  start: new Date(new Date().setFullYear(new Date().getFullYear() - 2))
    .toISOString()
    .split("T")[0],
  end: new Date().toISOString().split("T")[0],
};
