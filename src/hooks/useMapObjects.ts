// hooks/useMapObjects.ts
import { useEffect } from "react";
import type { Map } from "maplibre-gl";
import type { MapObject } from "../types/object.type";

type Params = {
  mapRef: React.MutableRefObject<Map | null>;
  ready: boolean;
  isAddingObject?: boolean;
  objectType?: string;
  onAddObject?: (obj: MapObject) => void;
};

export function useMapObjects({
  mapRef,
  ready,
  isAddingObject,
  objectType,
  onAddObject,
}: Params) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handleMapClick = (e: any) => {
      if (!isAddingObject || !onAddObject || !objectType) return;

      const clicked: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      onAddObject({
        id: "local-" + crypto.randomUUID(),
        type: objectType,
        coordinates: clicked,
      });
    };

    map.on("click", handleMapClick);
    return () => {
      map.off("click", handleMapClick);
    };
  }, [mapRef, ready, isAddingObject, objectType, onAddObject]);
}
