// hooks/useMapDeleting.ts
import { useEffect } from "react";
import type { Map } from "maplibre-gl";

type Params = {
  mapRef: React.MutableRefObject<Map | null>;
  ready: boolean;
  isDeleting?: boolean;
  onDeletePolygon?: (id: string) => void;
};

export function useMapDeleting({
  mapRef,
  ready,
  isDeleting,
  onDeletePolygon,
}: Params) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlePolygonDeleteClick = (e: any) => {
      if (!isDeleting || !onDeletePolygon) return;
      const feature = e.features?.[0];
      if (feature?.geometry?.type === "Polygon") {
        const polygonId = feature.properties?.id;
        if (polygonId) onDeletePolygon(polygonId);
      }
    };

    if (map.getLayer("polygons")) {
      map.on("click", "polygons", handlePolygonDeleteClick);
    }

    return () => {
      if (map.getLayer("polygons")) {
        map.off("click", "polygons", handlePolygonDeleteClick);
      }
    };
  }, [mapRef, ready, isDeleting, onDeletePolygon]);
}
