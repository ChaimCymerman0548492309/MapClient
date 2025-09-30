/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useMapDrawing.ts
import type { Map } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import {
  createVertexMarker,
  updateDrawingPreview,
} from "../components/MapManager";
import { closeRing } from "../components/MapUtils";
import type { Polygon } from "../types/polygon.type";

type Params = {
  mapRef: React.MutableRefObject<Map | null>;
  isDrawing: boolean;

  onFinishPolygon: (polygon: Polygon) => void;
};

export function useMapDrawing({
  mapRef,
  isDrawing,

  onFinishPolygon,
}: Params) {
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [coords, setCoords] = useState<[number, number][]>([]);

  // קליקים – הוספת נקודות או סגירת הפוליגון
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isDrawing) return;

    const handleMapClick = (e: any) => {
      const clicked: [number, number] = [e.lngLat.lng, e.lngLat.lat];

      if (coords.length > 2) {
        const [x1, y1] = coords[0];
        const [x2, y2] = clicked;
        if (Math.hypot(x1 - x2, y1 - y2) < 0.001) {
          onFinishPolygon({
            id: "local-" + crypto.randomUUID(),
            name: "Polygon",
            coordinates: [closeRing(coords)],
          });
          setCoords([]);
          markersRef.current.forEach((m) => m.remove());
          markersRef.current = [];
          return;
        }
      }

      setCoords((prev) => [...prev, clicked]);
      const marker = createVertexMarker(map, clicked); // עיגול בקודקוד
      markersRef.current.push(marker);
    };

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [mapRef, isDrawing, coords, setCoords, onFinishPolygon]);

  // mousemove – קו זמני עד העכבר
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isDrawing) return;

    const handleMouseMove = (e: any) => {
      const preview =
        coords.length > 0 ? [...coords, [e.lngLat.lng, e.lngLat.lat]] : [];
      updateDrawingPreview(map, preview as [number, number][]);
    };

    map.on("mousemove", handleMouseMove);
    return () => {
      map.off("mousemove", handleMouseMove);
    };
  }, [mapRef, isDrawing, coords]);

  // reset כש-isDrawing מתבטל
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!isDrawing) {
      // מנקה את הקווים הירוקים
      updateDrawingPreview(map, []);
      // מוחק markers זמניים
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      // מאפס את ה-coords
      setCoords([]);
    }
  }, [isDrawing, mapRef, setCoords]);
}
