import { useEffect, useState, useCallback } from "react";
import { updateDrawingPreview } from "../components/MapManager";
import type { Map, MapMouseEvent } from "maplibre-gl";
import type { Polygon } from "../types/polygon.type";

export function useMapDrawing({
  mapRef,
  isDrawing,
  onFinishPolygon,
}: {
  mapRef: React.MutableRefObject<Map | null>;
  isDrawing: boolean;
  onFinishPolygon: (polygon: Polygon) => void;
}) {
  const [coords, setCoords] = useState<[number, number][]>([]);

  const reset = useCallback(() => {
    setCoords([]);
    if (mapRef.current) updateDrawingPreview(mapRef.current, []);
  }, [mapRef]);

  useEffect(() => {
    if (!isDrawing) reset();
  }, [isDrawing, reset]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isDrawing) return;

    const handleClick = (e: MapMouseEvent) => {
      const clicked: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      if (coords.length > 2) {
        const [x1, y1] = coords[0];
        const [x2, y2] = clicked;
        if (Math.hypot(x1 - x2, y1 - y2) < 0.001) {
          onFinishPolygon({
            id: "local-" + crypto.randomUUID(),
            name: "Polygon",
            coordinates: [coords],
          });
          reset();
          return;
        }
      }
      setCoords((p) => [...p, clicked]);
    };

    const handleMove = (e: MapMouseEvent) =>
      updateDrawingPreview(map, [...coords, [e.lngLat.lng, e.lngLat.lat]]);

    map.on("click", handleClick);
    map.on("mousemove", handleMove);
    return () => {
      map.off("click", handleClick);
      map.off("mousemove", handleMove);
    };
  }, [mapRef, isDrawing, coords, onFinishPolygon, reset]);
}