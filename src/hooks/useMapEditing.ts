/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useMapEditing.ts
import type { Map } from "maplibre-gl";
import { useCallback, useEffect, useState } from "react";
import type { Polygon } from "../types/polygon.type";

type Dragging = { polyIndex: number; vertexIndex: number } | null;

type Params = {
  mapRef: React.MutableRefObject<Map | null>;
  ready: boolean;
  isEditing?: boolean;
  polygons: Polygon[];
  onUpdatePolygon: (polygonId: string, newRing: [number, number][]) => void;
};

export function useMapEditing({
  mapRef,
  ready,
  isEditing,
  polygons,

  onUpdatePolygon,
}: Params) {
  const [draggingVertex, setDraggingVertex] = useState<{
    polyIndex: number;
    vertexIndex: number;
  } | null>(null);

  /**
   * helper – find vertex near click
   */
  const findClickedVertex = useCallback(
    (point: [number, number]): Dragging => {
      for (let polyIndex = 0; polyIndex < polygons.length; polyIndex++) {
        for (
          let vertexIndex = 0;
          vertexIndex < polygons[polyIndex].coordinates[0].length;
          vertexIndex++
        ) {
          const vertex = polygons[polyIndex].coordinates[0][vertexIndex];
          if (Math.hypot(vertex[0] - point[0], vertex[1] - point[1]) < 0.001) {
            return { polyIndex, vertexIndex };
          }
        }
      }
      return null;
    },
    [polygons]
  );

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
  }, [
    mapRef,
    ready,
    isEditing,
    polygons,
    draggingVertex,
    setDraggingVertex,
    findClickedVertex,
    onUpdatePolygon,
  ]);
}
