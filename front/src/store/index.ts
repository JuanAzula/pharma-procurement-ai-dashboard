import { configureStore } from "@reduxjs/toolkit";
import { tedApi } from "@/services/tedApi";
import { forecastApi } from "@/services/forecastApi";
import { insightApi } from "@/services/insightApi";
import filterReducer from "./filterSlice";
import themeReducer from "./themeSlice";
import paginationReducer from "./paginationSlice";

export const store = configureStore({
  reducer: {
    [tedApi.reducerPath]: tedApi.reducer,
    [forecastApi.reducerPath]: forecastApi.reducer,
    [insightApi.reducerPath]: insightApi.reducer,
    filters: filterReducer,
    theme: themeReducer,
    pagination: paginationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      tedApi.middleware,
      forecastApi.middleware,
      insightApi.middleware
    ),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

