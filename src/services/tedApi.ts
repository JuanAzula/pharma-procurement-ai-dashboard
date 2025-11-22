import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  ProcurementNotice,
  SearchFilters,
  TEDSearchParams,
  TEDNoticeRaw,
} from '@/types/ted';
import {
  TED_API_BASE_URL,
  DEFAULT_PAGE_SIZE,
  COUNTRY_MAP,
  DRUG_KEYWORDS,
} from '@/config/ted';

/**
 * Transform raw TED API notice to our normalized format
 */
function transformNotice(raw: TEDNoticeRaw): ProcurementNotice | null {
  if (!raw.ND) return null;

  // Extract country code
  const country = raw.CY?.[0] || raw.PL || 'Unknown';
  
  // Extract CPV codes
  const cpvCodes = [
    ...(raw.PC || []),
    ...(raw.OC || []),
    ...(raw.RC || []),
  ].filter(Boolean);

  // Parse contract value if available
  let contractValue: number | undefined;
  let contractCurrency: string | undefined;
  
  if (raw.VI) {
    try {
      const valueStr = typeof raw.VI === 'string' ? raw.VI : JSON.stringify(raw.VI);
      const valueMatch = valueStr.match(/(\d+(?:\.\d+)?)/);
      const currencyMatch = valueStr.match(/([A-Z]{3})/);
      
      if (valueMatch) contractValue = parseFloat(valueMatch[1]);
      if (currencyMatch) contractCurrency = currencyMatch[1];
    } catch (e) {
      // Ignore parsing errors
    }
  }

  return {
    id: raw.ND,
    title: raw.TD || 'Untitled Notice',
    description: raw.TD,
    awardDate: raw.PD || '',
    publicationDate: raw.PD,
    country,
    countryName: COUNTRY_MAP[country] || country,
    cpvCodes,
    contractValue,
    contractCurrency,
    winningSupplier: raw.AU,
    noticeType: raw.TY,
    tedUrl: raw.ND ? `https://ted.europa.eu/udl?uri=TED:NOTICE:${raw.ND}:TEXT:EN:HTML` : undefined,
  };
}

/**
 * Build TED API search parameters from filters
 */
function buildSearchParams(filters: SearchFilters, page: number = 1): TEDSearchParams {
  const params: TEDSearchParams = {
    pageNum: page,
    pageSize: DEFAULT_PAGE_SIZE,
    reverseOrder: true, // Most recent first
    scope: 3, // All notices
  };

  // Add country filters
  if (filters.countries && filters.countries.length > 0) {
    params['cfc[]'] = filters.countries;
  }

  // Add CPV code filters
  if (filters.cpvCodes && filters.cpvCodes.length > 0) {
    params['cpv[]'] = filters.cpvCodes;
  }

  // Add date range filters
  if (filters.dateRange) {
    if (filters.dateRange.start) {
      params.pbd = filters.dateRange.start;
    }
    if (filters.dateRange.end) {
      params.ped = filters.dateRange.end;
    }
  }

  // Build search query
  const queryParts: string[] = [];
  
  // Add drug keywords to search
  queryParts.push(`(${DRUG_KEYWORDS.join(' OR ')})`);
  
  // Add supplier filter if provided
  if (filters.suppliers) {
    queryParts.push(`"${filters.suppliers}"`);
  }

  if (queryParts.length > 0) {
    params.q = queryParts.join(' AND ');
  }

  // Focus on contract award notices (type 7)
  params['pc[]'] = ['7'];

  return params;
}

/**
 * TED API Service using RTK Query
 */
export const tedApi = createApi({
  reducerPath: 'tedApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${TED_API_BASE_URL}/notices`,
  }),
  tagTypes: ['Notices'],
  endpoints: (builder) => ({
    searchNotices: builder.query<
      { notices: ProcurementNotice[]; total: number; page: number },
      { filters: SearchFilters; page?: number }
    >({
      query: ({ filters, page = 1 }) => {
        const params = buildSearchParams(filters, page);
        
        // Build query string manually to handle array parameters
        const queryString = new URLSearchParams();
        
        Object.entries(params).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            value.forEach((v) => queryString.append(key, v));
          } else if (value !== undefined) {
            queryString.append(key, String(value));
          }
        });

        return {
          url: `/search?${queryString.toString()}`,
        };
      },
      transformResponse: (response: any) => {
        // TED API returns different response formats
        // Handle both array and object responses
        let notices: TEDNoticeRaw[] = [];
        let total = 0;
        let page = 1;

        if (response) {
          if (Array.isArray(response)) {
            notices = response;
            total = response.length;
          } else if (response.notices) {
            notices = response.notices;
            total = response.total || notices.length;
            page = response.page || 1;
          } else if (response.results) {
            notices = response.results;
            total = response.total || notices.length;
            page = response.page || 1;
          }
        }

        // Transform and filter out null results
        const transformedNotices = notices
          .map(transformNotice)
          .filter((n): n is ProcurementNotice => n !== null);

        return {
          notices: transformedNotices,
          total,
          page,
        };
      },
      providesTags: ['Notices'],
    }),

    getNoticeDetails: builder.query<ProcurementNotice, string>({
      query: (noticeId) => `/notice/${noticeId}`,
      transformResponse: (response: TEDNoticeRaw) => {
        const notice = transformNotice(response);
        if (!notice) {
          throw new Error('Failed to parse notice details');
        }
        return notice;
      },
    }),
  }),
});

export const { useSearchNoticesQuery, useGetNoticeDetailsQuery } = tedApi;

