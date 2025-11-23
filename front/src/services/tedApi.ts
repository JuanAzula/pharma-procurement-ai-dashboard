import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  NoticeAggregations,
  ProcurementNotice,
  SearchFilters,
} from "@/types/ted";
import { TED_API_BASE_URL } from "@/config/ted";

interface NoticeSearchResponse {
  notices: ProcurementNotice[];
  total: number;
  page: number;
  limit: number;
  aggregations: NoticeAggregations;
}

export const tedApi = createApi({
  reducerPath: "tedApi",
  baseQuery: fetchBaseQuery({
    baseUrl: TED_API_BASE_URL,
  }),
  tagTypes: ["Notices"],
  endpoints: (builder) => ({
    searchNotices: builder.query<
      NoticeSearchResponse,
      { filters: SearchFilters; page?: number; targetLanguage?: string }
    >({
      query: ({ filters, page = 1, targetLanguage }) => ({
        url: "/notices/search",
          method: "POST",
        body: { filters, page, targetLanguage },
      }),
      providesTags: ["Notices"],
    }),
    translateNotices: builder.mutation<
      Record<string, { title: string; description: string }>,
      {
        items: { id: string; title: string; description?: string }[];
        targetLanguage: string;
      }
    >({
      query: (body) => ({
        url: "/translate/notices",
        method: "POST",
        body,
      }),
    }),
  }),
});

export const {
  useSearchNoticesQuery,
  useLazySearchNoticesQuery,
  useTranslateNoticesMutation,
} = tedApi;

