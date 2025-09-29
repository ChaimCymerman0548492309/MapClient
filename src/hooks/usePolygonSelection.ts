// hooks/usePolygonSelection.ts
import { useEffect } from "react";
import type { Map } from "maplibre-gl";
import type { Polygon } from "../types/polygon.type";
import type { MapObject } from "../types/object.type";
import { getObjectsInPolygon } from "../utils/getObjectsInPolygon";

type Params = {
  mapRef: React.MutableRefObject<Map | null>;
  ready: boolean;
  isSelecting: boolean;
  polygons: Polygon[];
  objects: MapObject[];
  onSelect: (polyId: string, insideObjects: MapObject[]) => void;
};

export function usePolygonSelection({
  mapRef,
  ready,
  isSelecting,
  polygons,
  objects,
  onSelect,
}: Params) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !isSelecting) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleClick = (e: any) => {
      const feature = e.features?.[0];
      if (feature?.geometry?.type === "Polygon") {
        const polyId = feature.properties?.id;
        const poly = polygons.find(p => p.id === polyId);
        if (!poly) return;

        const inside = getObjectsInPolygon(objects, poly.coordinates[0] as [number, number][]);
        onSelect(polyId, inside);
      }
    };

    if (map.getLayer("polygons")) {
      map.on("click", "polygons", handleClick);
    }

    return () => {
      if (map.getLayer("polygons")) {
        map.off("click", "polygons", handleClick);
      }
    };
  }, [mapRef, ready, isSelecting, polygons, objects, onSelect]);
}
