import { configureStore } from '@reduxjs/toolkit';
import { tedApi } from '@/services/tedApi';
import filterReducer from './filterSlice';

export const store = configureStore({
  reducer: {
    [tedApi.reducerPath]: tedApi.reducer,
    filters: filterReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(tedApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

