import { createSlice, createSelector } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { ProcurementNotice, SearchFilters } from "@/types/ted";
import { DEFAULT_PAGE_SIZE, FETCH_PAGE_SIZE } from "@/config/ted";

interface PaginationState {
  displayedNotices: ProcurementNotice[];
  allFilteredNotices: ProcurementNotice[];
  fallbackNotices: ProcurementNotice[];
  totalNotices: number;
  pageRangeStart: number;
  pageRangeEnd: number;
  currentApiPage: number;
  nextApiPage: number | null;
  displayOffset: number;
}

const initialState: PaginationState = {
  displayedNotices: [],
  allFilteredNotices: [],
  fallbackNotices: [],
  totalNotices: 0,
  pageRangeStart: 0,
  pageRangeEnd: 0,
  currentApiPage: 1,
  nextApiPage: null,
  displayOffset: 0,
};

const paginationSlice = createSlice({
  name: "pagination",
  initialState,
  reducers: {
    setPaginationData: (
      state,
      action: PayloadAction<{
        rawNotices: ProcurementNotice[];
        totalNotices: number;
        currentPage: number;
        filters: SearchFilters;
      }>
    ) => {
      const { rawNotices, totalNotices, currentPage, filters } =
        action.payload;
      const valueRange = filters.valueRange;
      const volumeRange = filters.volumeRange;
      const durationRange = filters.durationRange;
      const supplierQuery = filters.suppliers?.trim().toLowerCase();

      // Calculate pagination parameters
      const pagesPerFetch = Math.max(
        1,
        Math.floor(FETCH_PAGE_SIZE / DEFAULT_PAGE_SIZE)
      );
      const calculatedApiPage = Math.max(
        1,
        Math.ceil(currentPage / pagesPerFetch)
      );
      // Prefetch when we're on the second-to-last page of the current fetch
      // This ensures data is ready when user clicks to the last page
      // Edge case: if pagesPerFetch is 1, always prefetch
      const isSecondToLastPage =
        pagesPerFetch === 1
          ? true
          : currentPage % pagesPerFetch === pagesPerFetch - 1;
      const calculatedNextApiPage = isSecondToLastPage
        ? calculatedApiPage + 1
        : null;
      const subPageIndex = (currentPage - 1) % pagesPerFetch;
      const calculatedDisplayOffset = subPageIndex * DEFAULT_PAGE_SIZE;

      // Apply value range filtering
      let filteredNotices: ProcurementNotice[] = [];
      let fallbackNotices: ProcurementNotice[] = [];

      const hasValueFilter =
        (valueRange?.min ?? null) != null || (valueRange?.max ?? null) != null;

      if (!hasValueFilter) {
        filteredNotices = rawNotices;
        fallbackNotices = [];
      } else {
        const minValue = valueRange?.min;
        const maxValue = valueRange?.max;

        rawNotices.forEach((notice) => {
          if (notice.contractValue == null) {
            fallbackNotices.push(notice);
            return;
          }
          if (minValue != null && notice.contractValue < minValue) return;
          if (maxValue != null && notice.contractValue > maxValue) return;
          filteredNotices.push(notice);
        });
      }

      // Calculate displayed notices
      const combined = hasValueFilter
        ? filteredNotices
        : [...filteredNotices, ...fallbackNotices];

      const hasVolumeFilter =
        (volumeRange?.min ?? null) != null ||
        (volumeRange?.max ?? null) != null;
      const hasDurationFilter =
        (durationRange?.min ?? null) != null ||
        (durationRange?.max ?? null) != null;

      const matchesAdditionalFilters = (notice: ProcurementNotice) => {
        if (hasVolumeFilter) {
          if (notice.volume == null) return false;
          if (volumeRange?.min != null && notice.volume < volumeRange.min) {
            return false;
          }
          if (volumeRange?.max != null && notice.volume > volumeRange.max) {
            return false;
          }
        }

        if (hasDurationFilter) {
          if (notice.contractDurationMonths == null) return false;
          if (
            durationRange?.min != null &&
            notice.contractDurationMonths < durationRange.min
          ) {
            return false;
          }
          if (
            durationRange?.max != null &&
            notice.contractDurationMonths > durationRange.max
          ) {
            return false;
          }
        }

        if (supplierQuery) {
          const supplier =
            notice.winningSupplier?.toLowerCase() ??
            notice.buyerName?.toLowerCase() ??
            "";
          if (!supplier.includes(supplierQuery)) {
            return false;
          }
        }

        return true;
      };

      const aggregatedNotices = combined.filter(matchesAdditionalFilters);
      const displayedNotices =
        aggregatedNotices.length === 0
          ? []
          : aggregatedNotices.slice(
              calculatedDisplayOffset,
              calculatedDisplayOffset + DEFAULT_PAGE_SIZE
            );

      // Calculate page range
      const pageRangeStart =
        displayedNotices.length > 0
          ? (currentPage - 1) * DEFAULT_PAGE_SIZE + 1
          : 0;
      const pageRangeEnd =
        displayedNotices.length > 0
          ? pageRangeStart + displayedNotices.length - 1
          : 0;

      // Update state
      state.displayedNotices = displayedNotices;
      state.allFilteredNotices = aggregatedNotices;
      state.fallbackNotices = fallbackNotices;
      state.totalNotices =
        aggregatedNotices.length > 0 || hasValueFilter || hasVolumeFilter || hasDurationFilter || supplierQuery
          ? aggregatedNotices.length
          : totalNotices;
      state.pageRangeStart = pageRangeStart;
      state.pageRangeEnd = pageRangeEnd;
      state.currentApiPage = calculatedApiPage;
      state.nextApiPage = calculatedNextApiPage;
      state.displayOffset = calculatedDisplayOffset;
    },
    resetPagination: () => {
      return initialState;
    },
  },
});

export const { setPaginationData, resetPagination } = paginationSlice.actions;

// Selectors
export const selectDisplayedNotices = (state: {
  pagination: PaginationState;
}) => state.pagination.displayedNotices;

export const selectAllFilteredNotices = (state: {
  pagination: PaginationState;
}) => state.pagination.allFilteredNotices;

export const selectPaginationInfo = createSelector(
  [
    (state: { pagination: PaginationState }) => state.pagination.pageRangeStart,
    (state: { pagination: PaginationState }) => state.pagination.pageRangeEnd,
    (state: { pagination: PaginationState }) => state.pagination.totalNotices,
  ],
  (pageRangeStart, pageRangeEnd, totalNotices) => ({
    pageRangeStart,
    pageRangeEnd,
    totalNotices,
  })
);

export const selectApiPages = createSelector(
  [
    (state: { pagination: PaginationState }) => state.pagination.currentApiPage,
    (state: { pagination: PaginationState }) => state.pagination.nextApiPage,
  ],
  (currentApiPage, nextApiPage) => ({
    currentApiPage,
    nextApiPage,
  })
);

export default paginationSlice.reducer;
