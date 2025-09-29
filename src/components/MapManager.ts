/* eslint-disable @typescript-eslint/no-explicit-any */
// MapManager.ts
import { Map, Marker } from "maplibre-gl";

// פונקציות עזר לניהול המפה - ללא OOP
export const initializeMap = (
  container: HTMLDivElement, 
  onReady: () => void
): Map => {
  // יצירת מופע מפה חדש והגדרות בסיסיות
  const map = new Map({
    container,
    style: {
      version: 8,
      sources: {
        osm: {
          type: "raster",
          tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
          tileSize: 256,
        },
      },
      layers: [{ id: "osm", type: "raster", source: "osm" }],
    },
    center: [34.78, 32.07],
    zoom: 12,
  });

  map.on("load", onReady);
  return map;
};

export const updateOrCreateLayer = (
  map: Map,
  id: string,
  data: any ,
  layer: any
): void => {
  if (map.getSource(id)) {
    const source = map.getSource(id) as maplibregl.GeoJSONSource;
    source.setData(data);
  } else {
    map.addSource(id, { type: "geojson", data });
    map.addLayer({ id, source: id, ...layer });
  }
};

export const removeLayer = (map: Map, id: string): void => {
  // הסרת שכבה ממפה - אם קיימת
  if (map.getLayer(id)) map.removeLayer(id);
  if (map.getSource(id)) map.removeSource(id);
};

export const updatePolygonsLayer = (
  map: Map, 
  polygons: any[]
): void => {
  // עדכון שכבה של פוליגונים - ממיר את המערך לפורמט GeoJSON ומעדכן את המפה
  updateOrCreateLayer(
    map,
    "polygons",
    {
      type: "FeatureCollection",
      features: polygons.map((p) => ({
        type: "Feature",
        properties: { id: p.id },
        geometry: { type: "Polygon", coordinates: p.coordinates },
      })),
    },
    {
      type: "fill",
      paint: { "fill-color": "#3b82f6", "fill-opacity": 0.3 },
    }
  );
};

export const updateDrawingPreview = (
  map: Map,
  coords: [number, number][]
): void => {
  // עדכון קו מתאר בזמן ציור פוליגון - מראה את הקווים בין הנקודות
  if (!coords.length) {
    removeLayer(map, "preview");
    return;
  }
  
  updateOrCreateLayer(
    map,
    "preview",
    {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "LineString", coordinates: coords },
        },
      ],
    },
    { type: "line", paint: { "line-color": "#22c55e", "line-width": 2 } }
  );
};

export const createObjectMarker = (
  map: Map,
  object: any,
  getEmojiForType: (type: string) => string,
  onDelete?: (id: string) => void,
  isDeleting?: boolean
): Marker => {
  // יצירת marker לאובייקט עם emoji - מציג את האובייקט על המפה
  const el = document.createElement("div");
  el.innerHTML = getEmojiForType(object.type);
  el.className = "map-marker";
  
  const marker = new Marker({ element: el })
    .setLngLat(object.coordinates)
    .addTo(map);
  
  // הוספת אפשרות מחיקה אם במצב מחיקה
  if (isDeleting && onDelete) {
    el.onclick = () => onDelete(object.id);
  }
  
  return marker;
};

export const createVertexMarker = (
  map: Map,
  vertex: [number, number],
  options?: { color?: string }
): Marker => {
  // יצירת marker עגול קטן
  const el = document.createElement("div");
  el.style.width = "10px";
  el.style.height = "10px";
  el.style.borderRadius = "50%";
  el.style.backgroundColor = options?.color ?? "blue"; // ברירת מחדל כחול לעריכה
  el.style.border = "2px solid white"; // שיהיה קונטרסט ברור

  return new Marker({ element: el })
    .setLngLat(vertex)
    .addTo(map);
};

export const cleanupMap = (map: Map | null): void => {
  // ניקוי משאבים - הסרת המפה והמר�kers
  if (!map) return;
  map.remove();
};