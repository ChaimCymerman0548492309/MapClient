/* eslint-disable @typescript-eslint/no-explicit-any */
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { Polygon } from "../../types/polygon.type";
import { serverApi } from "../../api/api";

// --- Async Thunk ---
export const fetchPolygons = createAsyncThunk("polygons/fetchAll", async () => {
  const res = await serverApi.getPolygons();
  return res.map((p: any) => ({
    id: p.id,
    name: p.name,
    coordinates: [
      p.geometry.coordinates.exterior.positions.map((pos: any) => [
        pos.values[0],
        pos.values[1],
      ]),
    ],
  })) as Polygon[];
});

type PolygonState = {
  list: Polygon[];
  loading: boolean;
  error: string | null;
};

const initialState: PolygonState = {
  list: [],
  loading: false,
  error: null,
};

const polygonsSlice = createSlice({
  name: "polygons",
  initialState,
  reducers: {
    setPolygons: (state, action: PayloadAction<Polygon[]>) => {
      state.list = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPolygons.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPolygons.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchPolygons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch polygons";
      });
  },
});

export const { setPolygons } = polygonsSlice.actions;
export default polygonsSlice.reducer;
