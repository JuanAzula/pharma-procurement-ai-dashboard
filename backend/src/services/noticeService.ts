import axios from "axios";
import {
  COUNTRY_LABELS,
  DEFAULT_TARGET_COUNTRIES,
  FETCH_PAGE_SIZE,
  PHARMACEUTICAL_CPV_CODES,
  TED_API_BASE_URL,
  TED_SEARCH_ENDPOINT,
  TED_V3_FIELDS,
} from "../config/ted";
import type {
  CountryStat,
  ExpertSearchResponse,
  NoticeAggregations,
  NoticeSearchRequest,
  NoticeSearchResponse,
  ProcurementNotice,
  PublicExpertSearchRequest,
  SearchFilters,
  TEDNoticeRaw,
  TEDNoticeV3,
  TimelineBucket,
} from "../types/notices";
import { batchTranslate } from "./translationService";

const DEFAULT_LIMIT = FETCH_PAGE_SIZE;

const REQUEST_FIELDS = Array.from(new Set(TED_V3_FIELDS));

function flattenText(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    for (const entry of value) {
      const flattened = flattenText(entry);
      if (flattened) {
        return flattened;
      }
    }
    return undefined;
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    for (const entry of Object.values(record)) {
      const flattened = flattenText(entry);
      if (flattened) {
        return flattened;
      }
    }
  }
  return undefined;
}

/**
 * Searches for procurement notices based on provided filters.
 * Handles filtering, transformation, and aggregation of notice data.
 * 
 * @param params - Search parameters including filters, page, and limit
 * @returns A response containing the list of notices, total count, and aggregations
 */
export async function searchNotices(
  params: NoticeSearchRequest
): Promise<NoticeSearchResponse> {
  const { filters, page = 1, limit = DEFAULT_LIMIT, targetLanguage } = params;
  const requestBody: PublicExpertSearchRequest = {
    query: buildExpertQuery(filters),
    fields: REQUEST_FIELDS,
    page,
    limit: Math.min(limit, FETCH_PAGE_SIZE),
    paginationMode: "PAGE_NUMBER",
    onlyLatestVersions: true,
  };

  let data: ExpertSearchResponse;
  try {
    const response = await axios.post<ExpertSearchResponse>(
      `${TED_API_BASE_URL}${TED_SEARCH_ENDPOINT}`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    data = response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
        const fs = require('fs');
        fs.writeFileSync('error.log', JSON.stringify({
            error: error.response?.data || error.message,
            requestBody
        }, null, 2));
    }
    throw error;
  }

  let filteredNotices = (data.notices ?? [])
    .map(transformV3Notice)
    .map(transformNotice)
    .filter((notice): notice is ProcurementNotice => Boolean(notice));

  filteredNotices = applyValueRangeFilter(filteredNotices, filters.valueRange);
  filteredNotices = applyVolumeRangeFilter(filteredNotices, filters.volumeRange);
  // Duration filter is now applied server-side, but we keep this for extra safety
  filteredNotices = applyDurationRangeFilter(
    filteredNotices,
    filters.durationRange
  );
  filteredNotices = applySupplierFilter(filteredNotices, filters.suppliers);

  // Translation is now handled by a separate endpoint /translate/notices
  // so we don't block the search response.

  const aggregations = buildAggregations(filteredNotices);

  return {
    notices: filteredNotices,
    total: filteredNotices.length,
    page: data.page ?? page,
    limit: requestBody.limit ?? DEFAULT_LIMIT,
    aggregations,
  };
}

function buildExpertQuery(filters: SearchFilters): string {
  const queryParts: string[] = [];

  const countries = resolveCountryFilters(filters.countries);
  if (countries.length === 1) {
    queryParts.push(`CY=${countries[0]}`);
  } else {
    const clauses = countries.map((country) => `CY=${country}`);
    queryParts.push(`(${clauses.join(" OR ")})`);
  }

  const cpvCodes = resolveCpvFilters(filters.cpvCodes);
  if (cpvCodes.length === 1) {
    queryParts.push(`PC=${cpvCodes[0]}`);
  } else {
    const clauses = cpvCodes.map((code) => `PC=${code}`);
    queryParts.push(`(${clauses.join(" OR ")})`);
  }

  if (filters.dateRange) {
    const start = filters.dateRange.start?.replace(/-/g, "");
    const end = filters.dateRange.end?.replace(/-/g, "");
    if (start && end) {
      queryParts.push(`PD>=${start} AND PD<=${end}`);
    } else if (start) {
      queryParts.push(`PD>=${start}`);
    } else if (end) {
      queryParts.push(`PD<=${end}`);
    }
  }

  if (filters.durationRange) {
    const { min, max } = filters.durationRange;
    // We assume the user filters in months
    // TED API duration units: MONTH, YEAR, DAY
    // We'll construct a query that covers these cases approximately
    // For simplicity in this iteration, we'll focus on the MONTH unit which is most common
    // and convert YEARs to months for the query if possible, but the API doesn't support calculation.
    // So we will query for:
    // (duration-period-unit-lot=MONTH AND duration-period-value-lot >= min AND duration-period-value-lot <= max)
    // OR (duration-period-unit-lot=YEAR AND duration-period-value-lot >= min/12 ...)

    const clauses: string[] = [];

    if (min != null || max != null) {
      // Handle MONTHs
      const monthConditions: string[] = ["duration-period-unit-lot=MONTH"];
      if (min != null) monthConditions.push(`duration-period-value-lot>=${min}`);
      if (max != null) monthConditions.push(`duration-period-value-lot<=${max}`);
      clauses.push(`(${monthConditions.join(" AND ")})`);

      // Handle YEARs (approximate: min/12, max/12)
      const yearConditions: string[] = [
        "(duration-period-unit-lot=YEAR)",
      ];
      if (min != null)
        yearConditions.push(`duration-period-value-lot>=${Math.ceil(min / 12)}`);
      if (max != null)
        yearConditions.push(`duration-period-value-lot<=${Math.floor(max / 12)}`);
      clauses.push(`(${yearConditions.join(" AND ")})`);

      queryParts.push(`(${clauses.join(" OR ")})`);
    }
  }

  return queryParts.join(" AND ");
}

function resolveCountryFilters(selected?: string[]): string[] {
  const normalized = (selected || [])
    .map((code) => code.toUpperCase())
    .filter(Boolean);
  return normalized.length > 0 ? normalized : [...DEFAULT_TARGET_COUNTRIES];
}

function resolveCpvFilters(selected?: string[]): string[] {
  const normalized = (selected || []).filter(Boolean);
  return normalized.length > 0 ? normalized : [...PHARMACEUTICAL_CPV_CODES];
}

function transformV3Notice(notice: TEDNoticeV3): TEDNoticeRaw {
  const cpvCodes = notice["classification-cpv"];
  const cpvArray = Array.isArray(cpvCodes)
    ? (cpvCodes as (string | number)[]).map((value) => String(value))
    : cpvCodes
    ? [String(cpvCodes)]
    : undefined;

  const countrySource =
    notice["buyer-country"] ?? notice["place-of-performance-country-lot"];
  const countryArray = normalizeCountryCodes(countrySource);

  const titleText =
    flattenText(notice["title-lot"]) ??
    flattenText(notice["title-proc"]) ??
    flattenText(notice["description-lot"]) ??
    flattenText(notice["description-proc"]);

  const descriptionText =
    flattenText(notice["description-lot"]) ??
    flattenText(notice["description-proc"]);

  const noticeId =
    flattenText(notice["notice-identifier"]) ??
    (notice["notice-identifier"] != null
      ? String(notice["notice-identifier"])
      : undefined);

  const publicationDate =
    flattenText(notice["publication-date"]) ??
    (notice["publication-date"] != null
      ? String(notice["publication-date"])
      : undefined);

  const noticeType =
    flattenText(notice["notice-type"]) ??
    (notice["notice-type"] != null ? String(notice["notice-type"]) : undefined);

  const valueInfo =
    notice["result-value-lot"] ??
    notice["BT-27-Lot"] ??
    notice["BT-157-LotsGroup"];

  return {
    ND: noticeId,
    PD: publicationDate,
    TD: titleText,
    DS: descriptionText,
    TY: noticeType,
    CY: countryArray,
    PC: cpvArray,
    AU: flattenText(notice["winner-name"]),
    BN: flattenText(notice["buyer-name"]),
    VI: valueInfo as TEDNoticeRaw["VI"],
    NC:
      flattenText(notice["contract-nature"]) ??
      (notice["contract-nature"] != null
        ? String(notice["contract-nature"])
        : undefined),
    DU_VAL: flattenText(notice["duration-period-value-lot"]),
    DU_UNIT: flattenText(notice["duration-period-unit-lot"]),
  };
}

function transformNotice(raw: TEDNoticeRaw): ProcurementNotice | null {
  if (!raw.ND) {
    return null;
  }

  const countryCodes = normalizeCountryCodes(raw.CY ?? raw.PL);
  const primaryCountry = countryCodes[0] || "UNKNOWN";
  const countryName =
    countryCodes.length > 1
      ? countryCodes.join("-")
      : COUNTRY_LABELS[primaryCountry] || primaryCountry;

  const cpvCodesRaw = [...(raw.PC || []), ...(raw.OC || []), ...(raw.RC || [])]
    .filter(Boolean)
    .map((code) => {
      if (typeof code === "object" && code !== null) {
        const keys = Object.keys(code as Record<string, unknown>);
        return keys.length > 0 ? keys[0] : "";
      }
      return String(code);
    })
    .filter((code) => code.length > 0);

  const cpvCodes = Array.from(new Set(cpvCodesRaw));

  const { contractValue, contractCurrency } = extractContractValue(raw.VI);

  const descriptionText = raw.DS || raw.TD;
  const description =
    typeof descriptionText === "string"
      ? descriptionText
      : safeString(descriptionText) || undefined;
  
  // Prefer structured duration fields if available
  let durationInfo = extractContractDuration(description);
  if (raw.DU_VAL && raw.DU_UNIT) {
    const val = parseNumericString(raw.DU_VAL);
    if (val != null) {
      const unit = raw.DU_UNIT.toUpperCase();
      let months = 0;
      if (unit.includes("YEAR")) months = val * 12;
      else if (unit.includes("MONTH") || unit === "MO") months = val;
      else if (unit.includes("WEEK")) months = val / 4.345;
      else if (unit.includes("DAY")) months = val / 30;
      
      if (months > 0) {
        durationInfo = {
            label: `${val} ${raw.DU_UNIT.toLowerCase()}`,
            months
        };
      }
    }
  }

  const volumeEstimate = extractVolumeFromText(description);

  return {
    id: raw.ND,
    title: safeString(raw.TD) || "Untitled Notice",
    description,
    awardDate: safeString(raw.PD) || "",
    publicationDate: safeString(raw.PD),
    country: primaryCountry,
    countryName,
    cpvCodes,
    contractValue,
    contractCurrency,
    winningSupplier: safeString(raw.AU),
    buyerName: safeString(raw.BN),
    contractDuration: durationInfo?.label,
    contractDurationMonths: durationInfo?.months,
    volume: volumeEstimate,
    noticeType: safeString(raw.TY),
    tedUrl: raw.ND
      ? `https://ted.europa.eu/udl?uri=TED:NOTICE:${raw.ND}:TEXT:EN:HTML`
      : undefined,
  };
}

function buildAggregations(
  notices: ProcurementNotice[]
): NoticeAggregations {
  const timelineMap = new Map<string, Record<string, number>>();
  const countryMap = new Map<
    string,
    { contracts: number; totalValue: number }
  >();
  let minDate: string | undefined;
  let maxDate: string | undefined;

  for (const notice of notices) {
    if (notice.awardDate) {
      const dateKey = normalizeDateKey(notice.awardDate);
      if (dateKey) {
        if (!minDate || dateKey < minDate) minDate = dateKey;
        if (!maxDate || dateKey > maxDate) maxDate = dateKey;
      }
      const monthKey = normalizeMonthKey(notice.awardDate);
      if (monthKey && notice.country) {
        const counts = timelineMap.get(monthKey) ?? {};
        counts[notice.country] = (counts[notice.country] || 0) + 1;
        timelineMap.set(monthKey, counts);
      }
    }

    if (notice.country) {
      const stat =
        countryMap.get(notice.country) ?? { contracts: 0, totalValue: 0 };
      stat.contracts += 1;
      if (typeof notice.contractValue === "number") {
        stat.totalValue += notice.contractValue;
      }
      countryMap.set(notice.country, stat);
    }
  }

  const timeline: TimelineBucket[] = Array.from(timelineMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, counts]) => ({
      month,
      counts,
    }));

  const countries: CountryStat[] = Array.from(countryMap.entries())
    .map(([country, stat]) => ({
      country,
      contracts: stat.contracts,
      totalValue: stat.totalValue,
      avgValue:
        stat.contracts > 0 ? stat.totalValue / stat.contracts : 0,
    }))
    .sort((a, b) => b.contracts - a.contracts);

  return {
    timeline,
    countries,
    dateRange: {
      min: minDate,
      max: maxDate,
    },
  };
}

function normalizeDateKey(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const datePortion = value.split("T")[0];
  if (!datePortion) return undefined;
  return datePortion;
}

function normalizeMonthKey(value: string | undefined): string | undefined {
  const dateKey = normalizeDateKey(value);
  if (!dateKey) return undefined;
  const [year, month] = dateKey.split("-");
  if (!year || !month) return undefined;
  return `${year}-${month}`;
}

function normalizeCountryCodes(
  input: unknown
): string[] {
  if (!input) return [];
  if (typeof input === "string") {
    return [input.toUpperCase()];
  }
  if (Array.isArray(input)) {
    return input
      .flatMap((value) => normalizeCountryCodes(value))
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

function safeString(value: unknown): string | undefined {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>);
    return keys.length > 0 ? String(keys[0]) : undefined;
  }
  return String(value);
}

function extractContractValue(source: TEDNoticeRaw["VI"]): {
  contractValue?: number;
  contractCurrency?: string;
} {
  if (source === null || source === undefined) {
    return {};
  }

  if (typeof source === "number") {
    return { contractValue: source, contractCurrency: "EUR" };
  }

  if (typeof source === "string") {
    const numbers = source.match(/\d+(?:[.,]\d+)?/g);
    const contractValue =
      numbers && numbers.length > 0
        ? Math.max(
            ...numbers.map((n) => Number.parseFloat(n.replace(",", ".")))
          )
        : undefined;
    const currencyMatch = source.match(/\b([A-Z]{3})\b/);
    return {
      contractValue,
      contractCurrency: currencyMatch ? currencyMatch[1] : "EUR",
    };
  }

  if (typeof source === "object") {
    const viObj = source as Record<string, unknown>;
    const valueFields = ["value", "amount", "total", "price", "cost"];
    for (const field of valueFields) {
      const candidate = viObj[field];
      if (typeof candidate === "number") {
        return { contractValue: candidate, contractCurrency: "EUR" };
      }
      if (typeof candidate === "string") {
        const parsed = Number.parseFloat(
          candidate.replace(/[^\d.-]/g, "")
        );
        if (!Number.isNaN(parsed)) {
          return { contractValue: parsed, contractCurrency: "EUR" };
        }
      }
    }

    const currencyFields = ["currency", "curr", "ccy"];
    let contractCurrency: string | undefined;
    for (const field of currencyFields) {
      const candidate = viObj[field];
      if (candidate && typeof candidate === "string") {
        contractCurrency = candidate;
        break;
      }
    }

    const serialized = JSON.stringify(source);
    const numbers = serialized.match(/\d+(?:[.,]\d+)?/g);
    const contractValue =
      numbers && numbers.length > 0
        ? Math.max(
            ...numbers.map((n) => Number.parseFloat(n.replace(",", ".")))
          )
        : undefined;

    return {
      contractValue,
      contractCurrency: contractCurrency || "EUR",
    };
  }

  return {};
}

function applyValueRangeFilter(
  notices: ProcurementNotice[],
  valueRange?: SearchFilters["valueRange"]
): ProcurementNotice[] {
  if (!valueRange || (valueRange.min == null && valueRange.max == null)) {
    return notices;
  }

  return notices.filter((notice) => {
    if (notice.contractValue == null) {
      return false;
    }
    if (valueRange.min != null && notice.contractValue < valueRange.min) {
      return false;
    }
    if (valueRange.max != null && notice.contractValue > valueRange.max) {
      return false;
    }
    return true;
  });
}

function applyVolumeRangeFilter(
  notices: ProcurementNotice[],
  volumeRange?: SearchFilters["volumeRange"]
): ProcurementNotice[] {
  if (!volumeRange || (volumeRange.min == null && volumeRange.max == null)) {
    return notices;
  }

  return notices.filter((notice) => {
    if (notice.volume == null) {
      return false;
    }
    if (volumeRange.min != null && notice.volume < volumeRange.min) {
      return false;
    }
    if (volumeRange.max != null && notice.volume > volumeRange.max) {
      return false;
    }
    return true;
  });
}

function applyDurationRangeFilter(
  notices: ProcurementNotice[],
  durationRange?: SearchFilters["durationRange"]
): ProcurementNotice[] {
  if (!durationRange || (durationRange.min == null && durationRange.max == null)) {
    return notices;
  }

  return notices.filter((notice) => {
    if (notice.contractDurationMonths == null) {
      return false;
    }
    if (
      durationRange.min != null &&
      notice.contractDurationMonths < durationRange.min
    ) {
      return false;
    }
    if (
      durationRange.max != null &&
      notice.contractDurationMonths > durationRange.max
    ) {
      return false;
    }
    return true;
  });
}

function applySupplierFilter(
  notices: ProcurementNotice[],
  supplierQuery?: string
): ProcurementNotice[] {
  const normalized = supplierQuery?.trim().toLowerCase();
  if (!normalized) {
    return notices;
  }

  return notices.filter((notice) => {
    const supplier =
      notice.winningSupplier?.toLowerCase() ??
      notice.buyerName?.toLowerCase() ??
      "";
    return supplier.includes(normalized);
  });
}

function extractContractDuration(
  text?: string
): { label: string; months: number } | undefined {
  if (!text) {
    return undefined;
  }
  const durationRegex =
    /(\d{1,3}(?:[.,]\d{1,2})?)\s*(year|years|yr|yrs|month|months|mo|week|weeks|day|days)\b/i;
  const match = text.match(durationRegex);
  if (!match) {
    return undefined;
  }
  const numericValue = parseNumericString(match[1]);
  if (numericValue == null) {
    return undefined;
  }
  const unit = match[2].toLowerCase();
  let months: number | undefined;
  if (unit.startsWith("year") || unit.startsWith("yr")) {
    months = numericValue * 12;
  } else if (unit.startsWith("month") || unit === "mo") {
    months = numericValue;
  } else if (unit.startsWith("week")) {
    months = numericValue / 4.345;
  } else if (unit.startsWith("day")) {
    months = numericValue / 30;
  }
  if (months == null) {
    return undefined;
  }
  const normalizedUnit = unit.startsWith("mo") ? "months" : unit;
  const label = `${numericValue} ${normalizedUnit}`;
  return {
    label,
    months,
  };
}

function extractVolumeFromText(text?: string): number | undefined {
  if (!text) {
    return undefined;
  }
  const volumeRegex =
    /(\d{1,3}(?:[.\s]\d{3})*(?:[.,]\d+)?|\d+)\s*(units?|unit|pcs?|pieces?|pack(?:s)?|tablet(?:s)?|capsule(?:s)?|bottle(?:s)?|vial(?:s)?|dose(?:s)?|kit(?:s)?|sachet(?:s)?|ampoule(?:s)?|ml|l|liters?|litres?|kg|g)\b/i;
  const match = text.match(volumeRegex);
  if (!match) {
    return undefined;
  }
  const value = parseNumericString(match[1]);
  if (value == null) {
    return undefined;
  }
  return value;
}

function parseNumericString(value: string): number | undefined {
  const cleaned = value.replace(/\s/g, "");
  if (!cleaned) {
    return undefined;
  }
  const hasComma = cleaned.includes(",");
  const hasDot = cleaned.includes(".");
  let normalized = cleaned;
  if (hasComma && hasDot) {
    if (cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")) {
      normalized = cleaned.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = cleaned.replace(/,/g, "");
    }
  } else if (hasComma && !hasDot) {
    normalized = cleaned.replace(",", ".");
  }

  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

