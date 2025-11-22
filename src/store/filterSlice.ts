import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import type { SearchFilters } from '@/types/ted';
import { DEFAULT_DATE_RANGE, TARGET_COUNTRIES } from '@/config/ted';

interface FilterState {
  filters: SearchFilters;
  selectedNoticeId: string | null;
  currentPage: number;
}

const initialState: FilterState = {
  filters: {
    dateRange: {
      start: DEFAULT_DATE_RANGE.start,
      end: DEFAULT_DATE_RANGE.end,
    },
    countries: TARGET_COUNTRIES.map((c) => c.code),
    cpvCodes: [],
    suppliers: '',
    valueRange: {},
    volumeRange: {},
  },
  selectedNoticeId: null,
  currentPage: 1,
};

const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setDateRange: (
      state,
      action: PayloadAction<{ start: string; end: string }>
    ) => {
      state.filters.dateRange = action.payload;
      state.currentPage = 1; // Reset page when filters change
    },
    setCountries: (state, action: PayloadAction<string[]>) => {
      state.filters.countries = action.payload;
      state.currentPage = 1;
    },
    setCpvCodes: (state, action: PayloadAction<string[]>) => {
      state.filters.cpvCodes = action.payload;
      state.currentPage = 1;
    },
    setSuppliers: (state, action: PayloadAction<string>) => {
      state.filters.suppliers = action.payload;
      state.currentPage = 1;
    },
    setValueRange: (
      state,
      action: PayloadAction<{ min?: number; max?: number }>
    ) => {
      state.filters.valueRange = action.payload;
      state.currentPage = 1;
    },
    setVolumeRange: (
      state,
      action: PayloadAction<{ min?: number; max?: number }>
    ) => {
      state.filters.volumeRange = action.payload;
      state.currentPage = 1;
    },
    setFilters: (state, action: PayloadAction<SearchFilters>) => {
      state.filters = action.payload;
      state.currentPage = 1;
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
      state.currentPage = 1;
    },
    setSelectedNoticeId: (state, action: PayloadAction<string | null>) => {
      state.selectedNoticeId = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
  },
});

export const {
  setDateRange,
  setCountries,
  setCpvCodes,
  setSuppliers,
  setValueRange,
  setVolumeRange,
  setFilters,
  clearFilters,
  setSelectedNoticeId,
  setCurrentPage,
} = filterSlice.actions;

export default filterSlice.reducer;

