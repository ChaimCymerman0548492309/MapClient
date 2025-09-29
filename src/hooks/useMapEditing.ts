/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useMapEditing.ts
import { useEffect } from "react";
import type { Map } from "maplibre-gl";
import type { Polygon } from "../types/polygon.type";

type Dragging = { polyIndex: number; vertexIndex: number } | null;

type Params = {
  mapRef: React.MutableRefObject<Map | null>;
  ready: boolean;
  isEditing?: boolean;
  polygons: Polygon[];
  draggingVertex: Dragging;
  setDraggingVertex: React.Dispatch<React.SetStateAction<Dragging>>;
  findClickedVertex: (point: [number, number]) => Dragging;
  onUpdatePolygon: (polygonId: string, newRing: [number, number][]) => void;
};

export function useMapEditing({
  mapRef,
  ready,
  isEditing,
  polygons,
  draggingVertex,
  setDraggingVertex,
  findClickedVertex,
  onUpdatePolygon,
}: Params) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const handleDragStart = (e: any) => {
      if (!isEditing) return;
      const point: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const vertex = findClickedVertex(point);
      if (vertex) {
        setDraggingVertex(vertex);
        map.dragPan.disable();
      }
    };

    const handleDrag = (e: any) => {
      if (!draggingVertex || !isEditing) return;
      const newPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const { polyIndex, vertexIndex } = draggingVertex;
      const polygonId = polygons[polyIndex].id;
      const newCoordinates = [...polygons[polyIndex].coordinates[0]];
      newCoordinates[vertexIndex] = newPoint;
      onUpdatePolygon(polygonId, newCoordinates as [number, number][]);
    };

    const handleDragEnd = () => {
      if (!draggingVertex) return;
      setDraggingVertex(null);
      map.dragPan.enable();
    };

    map.on("mousedown", handleDragStart);
    map.on("mousemove", handleDrag);
    map.on("mouseup", handleDragEnd);

    return () => {
      map.off("mousedown", handleDragStart);
      map.off("mousemove", handleDrag);
      map.off("mouseup", handleDragEnd);
    };
  }, [mapRef, ready, isEditing, polygons, draggingVertex, setDraggingVertex, findClickedVertex, onUpdatePolygon]);
}
