import axios from "axios";
import {
  COUNTRY_LABELS,
  DEFAULT_TARGET_COUNTRIES,
  NOTICE_TYPES,
  PHARMACEUTICAL_CPV_CODES,
  TED_API_BASE_URL,
  TED_SEARCH_ENDPOINT,
  TED_V3_FIELDS,
} from "../config/ted";

interface ExpertSearchResponse {
  notices?: Record<string, unknown>[];
  page?: number;
  total?: number;
}

export interface ProcurementMacroEntry {
  countryCode: string;
  countryName: string;
  year: number;
  totalValueEUR: number;
  noticeCount: number;
  sampleNoticeId?: string;
  lastAwardDate?: string;
}

export interface ProcurementMacroOptions {
  year?: number;
  countries?: string[];
  cpvCodes?: string[];
  maxPages?: number;
}

interface MacroCacheEntry {
  expiresAt: number;
  data: ProcurementMacroEntry[];
}

const macroCache = new Map<string, MacroCacheEntry>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6 hours
const FALLBACK_YEAR = new Date().getUTCFullYear() - 1;
const MAX_LIMIT = 250;

const DEFAULT_FIELDS = Array.from(
  new Set([
    ...TED_V3_FIELDS,
    "publication-date",
    "result-value-lot",
    "BT-27-Lot",
    "BT-157-LotsGroup",
  ])
);

const DEFAULT_OPTIONS: Required<
  Pick<ProcurementMacroOptions, "year" | "countries" | "cpvCodes" | "maxPages">
> = {
  year: FALLBACK_YEAR,
  countries: [...DEFAULT_TARGET_COUNTRIES],
  cpvCodes: [...PHARMACEUTICAL_CPV_CODES],
  maxPages: 6,
};

export async function fetchPharmaProcurementMacro(
  options: ProcurementMacroOptions = {}
): Promise<ProcurementMacroEntry[]> {
  const merged: Required<
    Pick<ProcurementMacroOptions, "year" | "countries" | "cpvCodes" | "maxPages">
  > = {
    year: options.year ?? DEFAULT_OPTIONS.year,
    countries:
      options.countries && options.countries.length > 0
        ? [...new Set(options.countries.map((c) => c.toUpperCase()))]
        : [...DEFAULT_OPTIONS.countries],
    cpvCodes:
      options.cpvCodes && options.cpvCodes.length > 0
        ? [...new Set(options.cpvCodes)]
        : [...DEFAULT_OPTIONS.cpvCodes],
    maxPages: options.maxPages ?? DEFAULT_OPTIONS.maxPages,
  };

  const cacheKey = JSON.stringify(merged);
  const cached = macroCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const query = buildQuery(merged);
  const aggregates = new Map<string, ProcurementMacroEntry>();

  for (let page = 1; page <= merged.maxPages; page++) {
    const payload = {
      query,
      fields: DEFAULT_FIELDS,
      limit: MAX_LIMIT,
      page,
      paginationMode: "PAGE_NUMBER",
      onlyLatestVersions: true,
    };

    const { data } = await axios.post<ExpertSearchResponse>(
      `${TED_API_BASE_URL}${TED_SEARCH_ENDPOINT}`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const notices = data.notices ?? [];
    if (notices.length === 0) {
      break;
    }

    for (const notice of notices) {
      const countries = normalizeCountryCodes(
        notice["buyer-country"] ?? notice["place-of-performance-country-lot"]
      );
      const countryCode = countries[0];
      if (!countryCode) continue;

      const noticeId = String(notice["notice-identifier"] ?? "");
      const awardDate = normalizeDateString(notice["publication-date"]);
      const value =
        extractNumericValue(
          notice["result-value-lot"] ??
            notice["BT-27-Lot"] ??
            notice["BT-157-LotsGroup"]
        ) ?? 0;

      const entry =
        aggregates.get(countryCode) ??
        {
          countryCode,
          countryName: COUNTRY_LABELS[countryCode] || countryCode,
          year: merged.year,
          totalValueEUR: 0,
          noticeCount: 0,
        };

      entry.noticeCount += 1;
      if (value > 0) {
        entry.totalValueEUR += value;
      }
      if (!entry.sampleNoticeId && noticeId) {
        entry.sampleNoticeId = noticeId;
      }
      if (awardDate) {
        entry.lastAwardDate = awardDate;
      }

      aggregates.set(countryCode, entry);
    }

    if (notices.length < MAX_LIMIT) {
      break;
    }
  }

  const result = Array.from(aggregates.values()).sort(
    (a, b) => b.totalValueEUR - a.totalValueEUR
  );

  macroCache.set(cacheKey, {
    data: result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return result;
}

function buildQuery(options: {
  year: number;
  countries: string[];
  cpvCodes: string[];
}): string {
  const { year, countries, cpvCodes } = options;
  const queryParts: string[] = [];

  if (countries.length === 1) {
    queryParts.push(`CY=${countries[0]}`);
  } else if (countries.length > 1) {
    queryParts.push(
      `(${countries.map((code) => `CY=${code}`).join(" OR ")})`
    );
  }

  if (cpvCodes.length === 1) {
    queryParts.push(`PC=${cpvCodes[0]}`);
  } else if (cpvCodes.length > 1) {
    queryParts.push(`(${cpvCodes.map((code) => `PC=${code}`).join(" OR ")})`);
  }

  const startDate = `${year}0101`;
  const endDate = `${year}1231`;
  queryParts.push(`PD>=${startDate} AND PD<=${endDate}`);

  return queryParts.join(" AND ");
}

function normalizeCountryCodes(input: unknown): string[] {
  if (!input) return [];
  if (typeof input === "string") return [input.toUpperCase()];
  if (Array.isArray(input)) {
    return input
      .flatMap((item) => normalizeCountryCodes(item))
      .filter(Boolean);
  }
  if (typeof input === "object") {
    const keys = Object.keys(input as Record<string, unknown>);
    if (keys.length > 0) {
      return [keys[0].toUpperCase()];
    }
  }
  return [];
}

function normalizeDateString(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  return undefined;
}

function extractNumericValue(source: unknown): number | null {
  if (source === null || source === undefined) return null;
  if (typeof source === "number" && Number.isFinite(source)) {
    return source;
  }
  if (typeof source === "string") {
    const normalized = source.replace(/[^\d.,-]/g, "");
    const parts = normalized.match(/-?\d+(?:[.,]\d+)?/g);
    if (parts && parts.length > 0) {
      const parsed = parts
        .map((part) => Number.parseFloat(part.replace(",", ".")))
        .filter((n) => Number.isFinite(n));
      if (parsed.length > 0) {
        return Math.max(...parsed);
      }
    }
    return null;
  }
  if (typeof source === "object") {
    const obj = source as Record<string, unknown>;
    const candidateFields = ["value", "amount", "total", "price", "cost"];
    for (const field of candidateFields) {
      if (typeof obj[field] === "number") {
        return obj[field] as number;
      }
      if (typeof obj[field] === "string") {
        const parsed = Number.parseFloat(
          (obj[field] as string).replace(/[^\d.-]/g, "")
        );
        if (!Number.isNaN(parsed)) {
          return parsed;
        }
      }
    }
    const fallback = JSON.stringify(source);
    const numbers = fallback.match(/-?\d+(?:\.\d+)?/g);
    if (numbers && numbers.length > 0) {
      const numeric = numbers
        .map((value) => Number.parseFloat(value))
        .filter((n) => Number.isFinite(n));
      if (numeric.length > 0) {
        return Math.max(...numeric);
      }
    }
  }
  return null;
}

