// TED API Configuration

export const TED_API_BASE_URL = 'https://api.ted.europa.eu/v3';

// Target countries
export const TARGET_COUNTRIES = [
  { code: 'DE', name: 'Germany' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IT', name: 'Italy' },
  { code: 'PL', name: 'Poland' },
] as const;

export const COUNTRY_MAP: Record<string, string> = {
  DE: 'Germany',
  HU: 'Hungary',
  IT: 'Italy',
  PL: 'Poland',
};

// CPV codes for pharmaceutical products
// Based on Common Procurement Vocabulary (CPV)
export const PHARMACEUTICAL_CPV_CODES = [
  // Antineoplastic agents (Abiraterone)
  { code: '33600000', name: 'Pharmaceutical products', group: 'General' },
  { code: '33651600', name: 'Antineoplastic agents', group: 'Abiraterone' },
  { code: '33651000', name: 'Pharmaceutical preparations', group: 'General' },
  
  // Cardiovascular medicines (Eplerenone)
  { code: '33600000', name: 'Pharmaceutical products', group: 'General' },
  { code: '33631600', name: 'Cardiovascular system drugs', group: 'Eplerenone' },
  
  // Immunosuppressants (Pomalidomide)
  { code: '33600000', name: 'Pharmaceutical products', group: 'General' },
  { code: '33651700', name: 'Immunosuppressants', group: 'Pomalidomide' },
] as const;

// Search keywords for specific drugs
export const DRUG_KEYWORDS = [
  'Abiraterone',
  'Eplerenone',
  'Pomalidomide',
] as const;

// Notice types - focusing on contract awards
export const NOTICE_TYPES = {
  CONTRACT_AWARD: '7', // Contract award notice
  CONTRACT_NOTICE: '2', // Contract notice
  PRIOR_INFORMATION: '1', // Prior information notice
} as const;

// Default search parameters
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 100;

// Date range defaults (last 2 years)
export const DEFAULT_DATE_RANGE = {
  start: new Date(new Date().setFullYear(new Date().getFullYear() - 2))
    .toISOString()
    .split('T')[0],
  end: new Date().toISOString().split('T')[0],
};

