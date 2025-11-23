export const TED_API_BASE_URL =
  process.env.TED_API_BASE_URL || "https://api.ted.europa.eu";

export const TED_SEARCH_ENDPOINT = "/v3/notices/search";

export const DEFAULT_TARGET_COUNTRIES = ["HUN", "DEU", "ITA", "POL"] as const;

export const PHARMACEUTICAL_CPV_CODES = [
  "33600000",
  "33651000",
  "33651600",
  "33631600",
  "33652300",
] as const;

export const NOTICE_TYPES = {
  CONTRACT_AWARD: "7",
} as const;

export const TED_V3_FIELDS = [
  "notice-identifier",
  "publication-date",
  "title-lot",
  "title-proc",
  "description-lot",
  "description-proc",
  "buyer-name",
  "buyer-country",
  "place-of-performance-country-lot",
  "classification-cpv",
  "notice-type",
  "contract-nature",
  "winner-name",
  "result-value-lot",
  "BT-27-Lot",
  "BT-157-LotsGroup",
  "duration-period-value-lot",
  "duration-period-unit-lot",
] as const;

export const FETCH_PAGE_SIZE = 250;

export const COUNTRY_LABELS: Record<string, string> = {
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

