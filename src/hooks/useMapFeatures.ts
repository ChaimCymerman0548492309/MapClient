/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef } from "react";
import type { Map, Marker } from "maplibre-gl";
import { 
  updatePolygonsLayer,
  createObjectMarker,
  createVertexMarker,
} from "../components/MapManager";
import { getEmojiForType } from "../components/MapUtils";
import type { Polygon } from "../types/polygon.type";
import type { MapObject } from "../types/object.type";

type Params = {
  mapRef: React.MutableRefObject<Map | null>;
  ready: boolean;
  polygons: Polygon[];
  objects: MapObject[];
  isEditing?: boolean;
  isDeletingObjects?: boolean;
  onDeleteObject?: (id: string) => void;
};

export function useMapFeatures({
  mapRef,
  ready,
  polygons,
  objects,
  isEditing,
  isDeletingObjects,
  onDeleteObject,
}: Params) {
  const markersRef = useRef<Marker[]>([]);
  const vertexMarkersRef = useRef<Marker[]>([]);

  // Update polygons layer
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const safePolygons = polygons.filter(
      (p) => p.coordinates?.[0]?.length >= 4
    );
    updatePolygonsLayer(mapRef.current, safePolygons);
  }, [polygons, ready, mapRef]);

  // Update vertex markers (for editing)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    vertexMarkersRef.current.forEach((m) => m.remove());
    vertexMarkersRef.current = [];

    if (isEditing) {
      polygons.forEach((polygon) => {
        polygon.coordinates?.[0]?.forEach((vertex) => {
          const marker = createVertexMarker(map, vertex as [number, number]);
          vertexMarkersRef.current.push(marker);
        });
      });
    }
  }, [polygons, ready, isEditing, mapRef]);

  // Update object markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

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
  }, [objects, ready, isDeletingObjects, onDeleteObject, mapRef]);

  // Cleanup when unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach((m) => m.remove());
      vertexMarkersRef.current.forEach((m) => m.remove());
    };
  }, []);
}
