import axios from "axios";

// כתובת השרת (תעדכן לכתובת שלך אם צריך)
const API_BASE_URL = "http://localhost:5194/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const serverApi = {
  // -------------------- POLYGONS --------------------
  getPolygons: async () => {
    const res = await api.get("/polygons");
    return res.data;
  },

  addPolygon: async (polygon: { name: string; coordinates: number[][][] }) => {
    const res = await api.post("/polygons", polygon);
    return res.data;
  },

  deletePolygon: async (id: string) => {
    await api.delete(`/polygons/${id}`);
  },

  // -------------------- OBJECTS --------------------
  getObjects: async () => {
    const res = await api.get("/objects");
    return res.data;
  },

  addObject: async (obj: { type: string; coordinates: number[] }) => {
    const res = await api.post("/objects", obj);
    return res.data;
  },

  deleteObject: async (id: string) => {
    await api.delete(`/objects/${id}`);
  },
};
