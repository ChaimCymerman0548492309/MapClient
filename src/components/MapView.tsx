/* eslint-disable @typescript-eslint/no-explicit-any */
import maplibregl, { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import type { MapObject } from "../types/object.type";
import type { Polygon } from "../types/polygon.type";

type MapViewProps = {
  polygons: Polygon[];
  objects: MapObject[];
  isDrawing: boolean;
  onFinishPolygon: (polygon: Polygon) => void;
};

const MapView = ({
  polygons,
  objects,
  isDrawing,
  onFinishPolygon,
}: MapViewProps) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [currentCoords, setCurrentCoords] = useState<[number, number][]>([]);
// console.log("GeoJSON features:", polygons.map((p) => ({
//   type: "Feature",
//   properties: { name: p.name },
//   geometry: { type: "Polygon", coordinates: p.coordinates },
// })));

  // יצירת מפה פעם אחת
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainer.current,
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

    map.on("load", () => {
      setMapReady(true);
    });

    mapRef.current = map;
  }, []);

  // האזנה לקליקים רק במצב ציור
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || !isDrawing) return;

    const handleClick = (e: any) => {
      const lngLat: [number, number] = [e.lngLat.lng, e.lngLat.lat];

      // אם חזרנו לנקודת ההתחלה → סגירה
  if (
  currentCoords.length > 2 &&
  Math.abs(currentCoords[0][0] - lngLat[0]) < 0.0001 &&
  Math.abs(currentCoords[0][1] - lngLat[1]) < 0.0001
) {
  const closedCoords = [...currentCoords, currentCoords[0]];
  const polygon: Polygon = {
    id: "local-" + crypto.randomUUID(), // מזהה זמני
    name: "Polygon",
    coordinates: [closedCoords],
  };
  onFinishPolygon(polygon);   // 👈 שולח ל־HomePage
  setCurrentCoords([]);
} else {
  setCurrentCoords((prev) => [...prev, lngLat]);
}
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [isDrawing, currentCoords, mapReady, onFinishPolygon]);

  // פונקציה שמוסיפה שכבה מחדש
  const updateLayer = (id: string, source: any, layer: any) => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);

    map.addSource(id, source);
    map.addLayer({ id, source: id, ...layer });
  };

  // ציור שכבות
  useEffect(() => {
    if (!mapReady) return;

    // --- פוליגונים שמורים ---
    updateLayer(
      "polygons-fill",
      {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: polygons.map((p) => ({
            type: "Feature",
            properties: { name: p.name },
            geometry: { type: "Polygon", coordinates: p.coordinates },
          })),
        },
      },
      { type: "fill", paint: { "fill-color": "#3b82f6", "fill-opacity": 0.3 } }
    );

    // --- אובייקטים ---
    updateLayer(
      "objects-layer",
      {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: objects.map((o) => ({
            type: "Feature",
            properties: { type: o.type },
            geometry: { type: "Point", coordinates: o.coordinates },
          })),
        },
      },
      {
        type: "circle",
        paint: { "circle-radius": 6, "circle-color": "#f43f5e" },
      }
    );
  }, [polygons, objects, mapReady]);

  // --- Preview בזמן ציור ---
  useEffect(() => {
    if (!mapReady) return;
    const map = mapRef.current;
    if (!map) return;

    if (isDrawing && currentCoords.length) {
      // קווים
      updateLayer(
        "polygon-preview-line",
        {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                geometry: { type: "LineString", coordinates: currentCoords },
              },
            ],
          },
        },
        { type: "line", paint: { "line-color": "#22c55e", "line-width": 2 } }
      );

      // נקודות
      updateLayer(
        "polygon-preview-points",
        {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: currentCoords.map((c) => ({
              type: "Feature",
              geometry: { type: "Point", coordinates: c },
            })),
          },
        },
        {
          type: "circle",
          paint: { "circle-radius": 5, "circle-color": "#22c55e" },
        }
      );
    } else {
      if (map.getLayer("polygon-preview-line"))
        map.removeLayer("polygon-preview-line");
      if (map.getSource("polygon-preview-line"))
        map.removeSource("polygon-preview-line");
      if (map.getLayer("polygon-preview-points"))
        map.removeLayer("polygon-preview-points");
      if (map.getSource("polygon-preview-points"))
        map.removeSource("polygon-preview-points");
    }
  }, [isDrawing, currentCoords, mapReady]);

  return <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />;
};

export default MapView;
