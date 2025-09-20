/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useCallback } from "react";
import { Map } from "maplibre-gl";
import type { Polygon } from "../types/polygon.type";
import type { MapObject } from "../types/object.type";

type Props = {
  mapRef: React.MutableRefObject<Map | null>;
  ready: boolean;
  polygons: Polygon[];
  isDrawing: boolean;
  isAddingObject?: boolean;
  coords: [number, number][];
  setCoords: React.Dispatch<React.SetStateAction<[number, number][]>>;
  editingPolygonId: string | null;
  setEditingPolygonId: (id: string | null) => void;
  onFinishPolygon: (poly: Polygon) => void;
  onAddObject?: (obj: MapObject) => void;
  objectType?: string;
};

export const usePolygonEdit = ({
  mapRef,
  ready,
  polygons,
  isDrawing,
  isAddingObject,
  coords,
  setCoords,
  editingPolygonId,
  setEditingPolygonId,
  onFinishPolygon,
  onAddObject,
  objectType,
}: Props) => {
  const updateLayer = useCallback(
    (id: string, data: any, layer: any) => {
      const m = mapRef.current;
      if (!m || !ready) return;
      if (m.getLayer(id)) m.removeLayer(id);
      if (m.getSource(id)) m.removeSource(id);
      m.addSource(id, { type: "geojson", data });
      m.addLayer({ id, source: id, ...layer });
    },
    [mapRef, ready]
  );

  // ✅ ציור/סגירת פוליגון או הוספת אובייקט
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const handleClick = (e: any) => {
      const p: [number, number] = [e.lngLat.lng, e.lngLat.lat];

      if (isDrawing) {
        if (coords.length > 2) {
          const [x1, y1] = coords[0];
          const [x2, y2] = p;
          if (Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2) < 0.001) {
            onFinishPolygon({
              id: "local-" + crypto.randomUUID(),
              name: "Polygon",
              coordinates: [[...coords, coords[0]]],
            });
            setCoords([]);
            return;
          }
        }
        setCoords((prev) => [...prev, p]);
        if (editingPolygonId) setEditingPolygonId(null);
      } else if (isAddingObject && onAddObject && objectType) {
        onAddObject({
          id: "local-" + crypto.randomUUID(),
          type: objectType,
          coordinates: p,
        });
        if (editingPolygonId) setEditingPolygonId(null);
      }
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    coords,
    isDrawing,
    isAddingObject,
    objectType,
    onFinishPolygon,
    onAddObject,
    editingPolygonId,
    ready,
  ]);

  // ✅ עדכון שכבת הפוליגונים
  useEffect(() => {
    if (!ready) return;
    updateLayer(
      "polygons",
      {
        type: "FeatureCollection",
        features: polygons.map((p) => ({
          type: "Feature",
          properties: { id: p.id },
          geometry: { type: "Polygon", coordinates: p.coordinates },
        })),
      },
      { type: "fill", paint: { "fill-color": "#3b82f6", "fill-opacity": 0.3 } }
    );
  }, [polygons, ready, updateLayer]);
};
