/* ======================= useMapDeleting ======================= */
import { useEffect } from "react";
import type { Map, MapLayerMouseEvent } from "maplibre-gl";

type PolygonFeatureEvent = MapLayerMouseEvent & {
  features?: { geometry?: { type?: string }; properties?: { id?: string } }[];
};

export function useMapDeleting({
  mapRef,
  ready,
  isDeleting,
  onDeletePolygon,
}: {
  mapRef: React.MutableRefObject<Map | null>;
  ready: boolean;
  isDeleting?: boolean;
  onDeletePolygon?: (id: string) => void;
}) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const handleClick = (e: PolygonFeatureEvent): void => {
      if (!isDeleting || !onDeletePolygon) return;
      const feature = e.features?.[0];
      if (feature?.geometry?.type === "Polygon") {
        const id = feature.properties?.id;
        if (id) onDeletePolygon(id);
      }
    };

    if (map.getLayer("polygons")) {
      map.on("click", "polygons", handleClick);
      // cleanup function returning void
      return () => {
        if (map.getLayer("polygons")) map.off("click", "polygons", handleClick);
      };
    }

    // explicitly return void when no cleanup
    return;
  }, [mapRef, ready, isDeleting, onDeletePolygon]);
}
