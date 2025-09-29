/* eslint-disable @typescript-eslint/no-explicit-any */
// MapView.tsx
import { Map, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
import "../App.css";

// hooks לוגיקה חיצונית
import { useMapDrawing } from "../hooks/useMapDrawing";
import { useMapEditing } from "../hooks/useMapEditing";
import { useMapObjects } from "../hooks/useMapObjects";
import { useMapDeleting } from "../hooks/useMapDeleting";

// טיפוסי נתונים
import type { MapObject } from "../types/object.type";
import type { Polygon } from "../types/polygon.type";

// פונקציות עזר לניהול maplibre
import {
  cleanupMap,
  createObjectMarker,
  createVertexMarker,
  initializeMap,
  updatePolygonsLayer,
} from "./MapManager";
import { getEmojiForType } from "./MapUtils";

type Props = {
  polygons: Polygon[];
  objects: MapObject[];
  isDrawing: boolean;
  isAddingObject?: boolean;
  objectType?: string;
  isEditing?: boolean;
  isDeleting?: boolean;
  onFinishPolygon: (polygon: Polygon) => void;
  onAddObject?: (obj: MapObject) => void;
  onUpdatePolygon: (polygonId: string, newRing: [number, number][]) => void;
  onDeletePolygon?: (id: string) => void;
  isDeletingObjects?: boolean;
  onDeleteObject?: (id: string) => void;
};

const MapView = ({
  polygons,
  objects,
  isDrawing,
  onFinishPolygon,
  onAddObject,
  isAddingObject,
  objectType,
  isEditing,
  onUpdatePolygon,
  isDeleting,
  onDeletePolygon,
  isDeletingObjects,
  onDeleteObject,
}: Props) => {
  /**
   * refs – אחסון reference למפה ול־markers
   */
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Marker[]>([]);
  const vertexMarkersRef = useRef<Marker[]>([]);

  /**
   * state – סטייט פנימי של MapView
   */
  const [ready, setReady] = useState(false);
  const [coords, setCoords] = useState<[number, number][]>([]);
  const [draggingVertex, setDraggingVertex] = useState<{
    polyIndex: number;
    vertexIndex: number;
  } | null>(null);

  /**
   * אתחול המפה – רץ פעם אחת כשהקומפוננטה נטענת
   */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = initializeMap(containerRef.current, () => setReady(true));
    mapRef.current = map;

    // ניקוי בזמן unmount
    return () => {
      markersRef.current.forEach((m) => m.remove());
      vertexMarkersRef.current.forEach((m) => m.remove());
      cleanupMap(mapRef.current);
      mapRef.current = null;
    };
  }, []);

  /**
   * פונקציה עזר למציאת נקודת vertex קרובה (לצורך עריכה)
   */
  const findClickedVertex = useCallback(
    (point: [number, number]) => {
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

  /**
   * שימוש ב־hooks חיצוניים ללוגיקה של map
   */
  useMapDrawing({ mapRef, isDrawing, coords, setCoords, onFinishPolygon });
  useMapEditing({
    mapRef,
    ready,
    isEditing,
    polygons,
    draggingVertex,
    setDraggingVertex,
    findClickedVertex,
    onUpdatePolygon,
  });
  useMapObjects({ mapRef, ready, isAddingObject, objectType, onAddObject });
  useMapDeleting({ mapRef, ready, isDeleting, onDeletePolygon });

  /**
   * עדכון שכבת הפוליגונים על המפה כשיש שינוי
   */
  useEffect(() => {
    if (ready && mapRef.current) {
      updatePolygonsLayer(mapRef.current, polygons);
    }
  }, [polygons, ready]);

  /**
   * עדכון markers של נקודות עריכה (vertices) במצב עריכה
   */
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
  }, [polygons, ready, isEditing]);

  /**
   * עדכון markers של אובייקטים (objects) במפה
   */
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
  }, [objects, ready, isDeletingObjects, onDeleteObject]);

  /**
   * קביעת cursor לפי המצב הנוכחי
   */
  const getCursorClass = () => {
    if (isDrawing) return "cursor-draw";
    if (isAddingObject) return "cursor-add";
    if (isEditing) return "cursor-edit";
    return "cursor-grab";
  };

  return (
    <div ref={containerRef} className={`map-container ${getCursorClass()}`} />
  );
};

export default MapView;
