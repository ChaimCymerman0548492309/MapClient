/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useMapObjects.ts
import { useEffect, useRef } from "react";
import type { Map, Marker } from "maplibre-gl";
import type { MapObject } from "../types/object.type";
import { createObjectMarker } from "../components/MapManager";
import { getEmojiForType } from "../components/MapUtils";

type Params = {
  mapRef: React.MutableRefObject<Map | null>;
  ready: boolean;
  isAddingObject?: boolean;
  objectType?: string;
  onAddObject?: (obj: MapObject) => void;
  isDeletingObjects?: boolean;
  onDeleteObject?: (id: string) => void;
  objects?: MapObject[];
};

export function useMapObjects({
  mapRef,
  ready,
  isAddingObject,
  objectType,
  onAddObject,
  isDeletingObjects,
  onDeleteObject,
  objects = [],
}: Params) {
  const markersRef = useRef<Marker[]>([]);

  // Adding objects on click
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

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

  // Render & update object markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Add fresh markers
    objects.forEach((obj) => {
      const marker = createObjectMarker(
        map,
        obj,
        getEmojiForType,
        onDeleteObject,
        isDeletingObjects
      );
      markersRef.current.push(marker);
    });
  }, [mapRef, ready, objects, isDeletingObjects, onDeleteObject]);

  // Cleanup
  useEffect(() => {
    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, []);
}
