// MapView.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Map, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
import "../App.css";
import type { MapObject } from "../types/object.type";
import type { Polygon } from "../types/polygon.type";
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
  const mapRef = useRef<Map | null>(null); // שמירת מופע המפה
  const containerRef = useRef<HTMLDivElement>(null); // אלמנט ה־DOM שבו נטען המפה
  const markersRef = useRef<Marker[]>([]); // שמירת כל ה־markers של אובייקטים
  const vertexMarkersRef = useRef<Marker[]>([]); // markers לנקודות עריכה של פוליגון
  const [ready, setReady] = useState(false); // מצב טעינת המפה
  const [coords, setCoords] = useState<[number, number][]>([]); // נקודות בזמן ציור פוליגון
  const [draggingVertex, setDraggingVertex] = useState<{
    polyIndex: number;
    vertexIndex: number;
  } | null>(null);

  // יצירת המפה והגדרות בסיסיות
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
          },
        },
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: [34.78, 32.07],
      zoom: 12,
    });

    map.on("load", () => setReady(true));
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      vertexMarkersRef.current.forEach((m) => m.remove());
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // פונקציה גנרית: יצירה או עדכון של שכבה קיימת
  const updateOrCreateLayer = useCallback(
    (id: string, data: any, layer: any) => {
      const m = mapRef.current;
      if (!m || !ready) return;
      if (m.getSource(id)) {
        const source = m.getSource(id) as any;
        if (source?.setData) source.setData(data);
        return;
      }
      if (m.getLayer(id)) m.removeLayer(id);
      if (m.getSource(id)) m.removeSource(id);
      m.addSource(id, { type: "geojson", data });
      m.addLayer({ id, source: id, ...layer });
    },
    [ready]
  );

  // עדכון פוליגונים על המפה
  const updatePolygonsOnMap = useCallback(
    (polygonsToUpdate: Polygon[]) => {
      if (!ready) return;
      updateOrCreateLayer(
        "polygons",
        {
          type: "FeatureCollection",
          features: polygonsToUpdate.map((p) => ({
            type: "Feature",
            properties: { id: p.id },
            geometry: { type: "Polygon", coordinates: p.coordinates },
          })),
        },
        {
          type: "fill",
          paint: { "fill-color": "#3b82f6", "fill-opacity": 0.3 },
        }
      );
    },
    [ready, updateOrCreateLayer]
  );

  // עדכון נקודות עריכה (vertex markers) בעת מצב עריכה
  const updateVertexMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !ready || !isEditing) return;
    vertexMarkersRef.current.forEach((m) => m.remove());
    vertexMarkersRef.current = [];
    polygons.forEach((polygon) => {
      polygon.coordinates?.[0]?.forEach((vertex) => {
        const el = document.createElement("div");
        el.innerHTML = "●";
        el.className = "map-vertex"; // CSS
        const marker = new Marker({ element: el })
          .setLngLat(vertex as [number, number])
          .addTo(map);
        vertexMarkersRef.current.push(marker);
      });
    });
  }, [polygons, ready, isEditing]);

  // האזנה לאירועים: ציור, הוספה, עריכה וגרירה
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    // קליק על המפה
    const click = (e: any) => {
      const p: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      if (isDrawing) {
        // סיום פוליגון אם חוזרים לנקודה הראשונה
        if (coords.length > 2) {
          const [x1, y1] = coords[0];
          const [x2, y2] = p;
          if (Math.hypot(x1 - x2, y1 - y2) < 0.001) {
            onFinishPolygon({
              id: "local-" + crypto.randomUUID(),
              name: "Polygon",
              coordinates: [[...coords, coords[0]]],
            });
            setCoords([]);
            return;
          }
        }
        setCoords((prev) => [...prev, p]);
      } else if (isAddingObject && onAddObject && objectType) {
        // הוספת אובייקט חדש
        onAddObject({
          id: "local-" + crypto.randomUUID(),
          type: objectType,
          coordinates: p,
        });
      }
    };

    // התחלת גרירה של נקודת פוליגון
    const onDragStart = (e: any) => {
      if (!isEditing) return;
      const point = [e.lngLat.lng, e.lngLat.lat];
      for (let polyIndex = 0; polyIndex < polygons.length; polyIndex++) {
        for (
          let vertexIndex = 0;
          vertexIndex < polygons[polyIndex].coordinates[0].length;
          vertexIndex++
        ) {
          const vertex = polygons[polyIndex].coordinates[0][vertexIndex];
          if (Math.hypot(vertex[0] - point[0], vertex[1] - point[1]) < 0.001) {
            setDraggingVertex({ polyIndex, vertexIndex });
            map.dragPan.disable();
            return;
          }
        }
      }
    };

    // תוך כדי גרירה: עדכון נקודה
    const onDrag = (e: any) => {
      if (!draggingVertex || !isEditing) return;
      const newPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const { polyIndex, vertexIndex } = draggingVertex;
      const polygonId = polygons[polyIndex].id;
      const newCoordinates = [...polygons[polyIndex].coordinates[0]];
      newCoordinates[vertexIndex] = newPoint;
      onUpdatePolygon(polygonId, newCoordinates as [number, number][]);
    };

    // סוף גרירה
    const onDragEnd = () => {
      if (!draggingVertex) return;
      setDraggingVertex(null);
      map.dragPan.enable();
    };

    map.on("click", click);
    map.on("mousedown", onDragStart);
    map.on("mousemove", onDrag);
    map.on("mouseup", onDragEnd);

    return () => {
      map.off("click", click);
      map.off("mousedown", onDragStart);
      map.off("mousemove", onDrag);
      map.off("mouseup", onDragEnd);
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
  ]);

  // עדכון פוליגונים קיימים
  useEffect(() => {
    if (ready) updatePolygonsOnMap(polygons);
  }, [polygons, ready, updatePolygonsOnMap]);

  // עדכון preview בזמן ציור
  useEffect(() => {
    const m = mapRef.current;
    if (!m || !ready) return;
    if (isDrawing && coords.length) {
      updateOrCreateLayer(
        "preview",
        {
          type: "FeatureCollection",
          features: [
            {
              type: "Feature",
              geometry: { type: "LineString", coordinates: coords },
            },
          ],
        },
        { type: "line", paint: { "line-color": "#22c55e", "line-width": 2 } }
      );
    } else {
      if (m.getLayer("preview")) m.removeLayer("preview");
      if (m.getSource("preview")) m.removeSource("preview");
    }
  }, [coords, isDrawing, ready, updateOrCreateLayer]);

  // עדכון markers של נקודות עריכה
  useEffect(() => {
    if (isEditing) updateVertexMarkers();
    else {
      vertexMarkersRef.current.forEach((m) => m.remove());
      vertexMarkersRef.current = [];
    }
  }, [isEditing, updateVertexMarkers]);

  // עדכון markers לאובייקטים (עם emoji)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    objects.forEach((o) => {
      const el = document.createElement("div");
      el.innerHTML = getEmojiForType(o.type);
      el.className = "map-marker"; // CSS
      const marker = new Marker({ element: el })
        .setLngLat(o.coordinates)
        .addTo(map);
      markersRef.current.push(marker);
      el.onclick = () => {
        if (isDeletingObjects) onDeleteObject?.(o.id);
      };
    });
  }, [objects, ready, isDeletingObjects, onDeleteObject]);

  // האזנה למחיקת פוליגונים בלחיצה
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;
    const handleDeleteClick = (e: any) => {
      if (!isDeleting) return;
      const feature = e.features?.[0];
      if (feature?.geometry?.type === "Polygon") {
        const polygonId = feature.properties?.id;
        if (polygonId) onDeletePolygon?.(polygonId);
      }
    };
    if (map.getLayer("polygons"))
      map.on("click", "polygons", handleDeleteClick);
    return () => {
      if (map?.getLayer("polygons"))
        map.off("click", "polygons", handleDeleteClick);
    };
  }, [ready, isDeleting, onDeletePolygon]);

  return (
    <div
      ref={containerRef}
      className={`map-container ${
        isDrawing
          ? "cursor-draw"
          : isAddingObject
          ? "cursor-add"
          : isEditing
          ? "cursor-edit"
          : "cursor-grab"
      }`}
    />
  );
};

export default MapView;
