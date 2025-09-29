/* eslint-disable @typescript-eslint/no-explicit-any */
// MapView.tsx
import { Map, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
import "../App.css";
import type { MapObject } from "../types/object.type";
import type { Polygon } from "../types/polygon.type";
import {
  cleanupMap,
  createObjectMarker,
  createVertexMarker,
  initializeMap,
  updateDrawingPreview,
  updatePolygonsLayer,
} from "./MapManager";
import { closeRing, getEmojiForType } from "./MapUtils";

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
  // refs - שמירת רפרנסים למפה ול-markers
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Marker[]>([]);
  const vertexMarkersRef = useRef<Marker[]>([]);

  // state - ניהול מצב המפה והנתונים
  const [ready, setReady] = useState(false);
  const [coords, setCoords] = useState<[number, number][]>([]);
  const [draggingVertex, setDraggingVertex] = useState<{
    polyIndex: number;
    vertexIndex: number;
  } | null>(null);

  // אפקט לטעינת המפה - רץ פעם אחת בלבד
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // אתחול המפה
    const map = initializeMap(containerRef.current, () => setReady(true));
    mapRef.current = map;

    // cleanup function - ניקוי כאשר הקומפוננטה נהרסת
    return () => {
      markersRef.current.forEach((m) => m.remove());
      vertexMarkersRef.current.forEach((m) => m.remove());
      cleanupMap(mapRef.current);
      mapRef.current = null;
    };
  }, []);

  // פונקציה למציאת נקודת vertex שנלחצה - עבור מצב עריכה
  const findClickedVertex = useCallback(
    (point: [number, number]) => {
      for (let polyIndex = 0; polyIndex < polygons.length; polyIndex++) {
        for (
          let vertexIndex = 0;
          vertexIndex < polygons[polyIndex].coordinates[0].length;
          vertexIndex++
        ) {
          const vertex = polygons[polyIndex].coordinates[0][vertexIndex];
          // בדיקה אם הלחיצה קרובה לנקודה קיימת
          if (Math.hypot(vertex[0] - point[0], vertex[1] - point[1]) < 0.001) {
            return { polyIndex, vertexIndex };
          }
        }
      }
      return null;
    },
    [polygons]
  );

  // אפקט להאזנה לאירועי מפה - לחיצה וגרירה
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    // handler ללחיצת מפה - טיפול בציור והוספת אובייקטים
    const handleMapClick = (e: any) => {
      const clickedPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];

      if (isDrawing) {
        // מצב ציור - הוספת נקודות לפוליגון
        if (coords.length > 2) {
          const [x1, y1] = coords[0];
          const [x2, y2] = clickedPoint;
          // בדיקה אם חוזרים לנקודת ההתחלה לסיום הפוליגון
          if (Math.hypot(x1 - x2, y1 - y2) < 0.001) {
            onFinishPolygon({
              id: "local-" + crypto.randomUUID(),
              name: "Polygon",
              // coordinates: [[...coords, coords[0]]],
              coordinates: [closeRing(coords)],
            });
            setCoords([]);
            return;
          }
        }
        setCoords((prev) => [...prev, clickedPoint]);
      } else if (isAddingObject && onAddObject && objectType) {
        // מצב הוספת אובייקט - יצירת אובייקט חדש
        onAddObject({
          id: "local-" + crypto.randomUUID(),
          type: objectType,
          coordinates: clickedPoint,
        });
      }
    };

    // handler להתחלת גרירה - עבור עריכת נקודות פוליגון
    const handleDragStart = (e: any) => {
      if (!isEditing) return;
      const point: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const vertex = findClickedVertex(point);
      if (vertex) {
        setDraggingVertex(vertex);
        map.dragPan.disable(); // השבתת גרירת מפה בזמן גרירת נקודה
      }
    };

    // handler לגרירה - עדכון מיקום נקודה בזמן גרירה
    const handleDrag = (e: any) => {
      if (!draggingVertex || !isEditing) return;
      const newPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const { polyIndex, vertexIndex } = draggingVertex;
      const polygonId = polygons[polyIndex].id;
      const newCoordinates = [...polygons[polyIndex].coordinates[0]];
      newCoordinates[vertexIndex] = newPoint;
      onUpdatePolygon(polygonId, newCoordinates as [number, number][]);
    };

    // handler לסיום גרירה - שחזור מצב רגיל
    const handleDragEnd = () => {
      if (!draggingVertex) return;
      setDraggingVertex(null);
      map.dragPan.enable(); // הפעלת גרירת מפה מחדש
    };

    // רישום האזנות לאירועים
    map.on("click", handleMapClick);
    map.on("mousedown", handleDragStart);
    map.on("mousemove", handleDrag);
    map.on("mouseup", handleDragEnd);

    // cleanup - הסרת האזנות כאשר הקומפוננטה unmount
    return () => {
      map.off("click", handleMapClick);
      map.off("mousedown", handleDragStart);
      map.off("mousemove", handleDrag);
      map.off("mouseup", handleDragEnd);
    };
  }, [
    coords,
    isDrawing,
    isAddingObject,
    isEditing,
    draggingVertex,
    onFinishPolygon,
    onAddObject,
    objectType,
    ready,
    polygons,
    onUpdatePolygon,
    findClickedVertex,
  ]);

  // אפקט לעדכון הפוליגונים על המפה כאשר הם משתנים
  useEffect(() => {
    if (ready && mapRef.current) {
      updatePolygonsLayer(mapRef.current, polygons);
    }
  }, [polygons, ready]);

  // אפקט לעדכון קו המתאר בזמן ציור
  useEffect(() => {
    if (!mapRef.current || !ready) return;
    updateDrawingPreview(mapRef.current, coords);
  }, [coords, isDrawing, ready]);

  // אפקט לעדכון נקודות העריכה (vertices) במצב עריכה
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    // ניקוי markers קודמים
    vertexMarkersRef.current.forEach((m) => m.remove());
    vertexMarkersRef.current = [];

    if (isEditing) {
      // יצירת markers חדשים לכל נקודות הפוליגונים
      polygons.forEach((polygon) => {
        polygon.coordinates?.[0]?.forEach((vertex) => {
          const marker = createVertexMarker(map, vertex as [number, number]);
          vertexMarkersRef.current.push(marker);
        });
      });
    }
  }, [polygons, ready, isEditing]);

  // אפקט לעדכון markers של אובייקטים
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    // ניקוי markers קודמים
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // יצירת markers חדשים לכל אובייקט
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

  // אפקט להאזנה למחיקת פוליגונים בלחיצה
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const handlePolygonDeleteClick = (e: any) => {
      if (!isDeleting || !onDeletePolygon) return;
      const feature = e.features?.[0];
      if (feature?.geometry?.type === "Polygon") {
        const polygonId = feature.properties?.id;
        if (polygonId) onDeletePolygon(polygonId);
      }
    };

    // הוספת האזנה רק אם השכבה קיימת
    if (map.getLayer("polygons")) {
      map.on("click", "polygons", handlePolygonDeleteClick);
    }

    return () => {
      if (map.getLayer("polygons")) {
        map.off("click", "polygons", handlePolygonDeleteClick);
      }
    };
  }, [ready, isDeleting, onDeletePolygon]);

  // קביעת סוג Cursor לפי המצב הנוכחי
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
