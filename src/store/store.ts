// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import polygonsReducer from "./slices/polygonsSlice";
import objectsReducer from "./slices/objectsSlice";

export const store = configureStore({
  reducer: {
    polygons: polygonsReducer,
    objects: objectsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
