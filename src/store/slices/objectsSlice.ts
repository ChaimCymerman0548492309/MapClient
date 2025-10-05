/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";

import { serverApi } from "../../api/api";
import type { MapObject } from "../../types/object.type";

export const fetchObjects = createAsyncThunk("objects/fetchAll", async () => {
  const res = await serverApi.getObjects();
  return res.map((o: any) => ({
    id: o.id,
    type: o.type,
    coordinates: [
      o.location.coordinates.longitude,
      o.location.coordinates.latitude,
    ],
  })) as MapObject[];
});

type ObjectState = {
  list: MapObject[];
  loading: boolean;
  error: string | null;
};

const initialState: ObjectState = {
  list: [],
  loading: false,
  error: null,
};

const objectsSlice = createSlice({
  name: "objects",
  initialState,
  reducers: {
    setObjects: (state, action: PayloadAction<MapObject[]>) => {
      state.list = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchObjects.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchObjects.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchObjects.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch objects";
      });
  },
});

export const { setObjects } = objectsSlice.actions;
export default objectsSlice.reducer;
