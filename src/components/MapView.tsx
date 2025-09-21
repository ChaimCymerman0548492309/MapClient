/* eslint-disable @typescript-eslint/no-explicit-any */
import { Map, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Marker[]>([]);
  const vertexMarkersRef = useRef<Marker[]>([]);
  const [ready, setReady] = useState(false);
  const [coords, setCoords] = useState<[number, number][]>([]);
  const [draggingVertex, setDraggingVertex] = useState<{
    polyIndex: number;
    vertexIndex: number;
  } | null>(null);

  // יצירת המפה
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
        layers: [
          {
            id: "osm",
            type: "raster",
            source: "osm",
          },
        ],
      },
      center: [34.78, 32.07],
      zoom: 12,
    });

    map.on("load", () => setReady(true));
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      vertexMarkersRef.current.forEach((m) => m.remove());
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // 🔥 פונקציה משופרת לעדכון שכבות - עדכון במקום מחיקה ויצירה
  const updateOrCreateLayer = useCallback(
    (id: string, data: any, layer: any) => {
      const m = mapRef.current;
      if (!m || !ready) return;

      // אם המקור קיים, עדכן רק את הנתונים
      if (m.getSource(id)) {
        const source = m.getSource(id) as any;
        if (source && typeof source.setData === 'function') {
          source.setData(data);
          return;
        }
      }

      // אחרת, צור מחדש
      if (m.getLayer(id)) m.removeLayer(id);
      if (m.getSource(id)) m.removeSource(id);

      m.addSource(id, { type: "geojson", data });
      m.addLayer({ id, source: id, ...layer });
    },
    [ready]
  );

  // עדכון פוליגונים על המפה - משתמש בפונקציה המשופרת
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
            geometry: {
              type: "Polygon",
              coordinates: p.coordinates,
            },
          })),
        },
        {
          type: "fill",
          paint: {
            "fill-color": "#3b82f6",
            "fill-opacity": 0.3,
          },
        }
      );
    },
    [ready, updateOrCreateLayer]
  );

  // עדכון markers לקודקודים בעריכה
  const updateVertexMarkers = useCallback(() => {
    const map = mapRef.current;
    if (!map || !ready || !isEditing) return;

    // נקה markers קודמים
    vertexMarkersRef.current.forEach((m) => m.remove());
    vertexMarkersRef.current = [];

    // הוסף markers לקודקודים
    polygons.forEach((polygon) => {
      polygon.coordinates?.[0]?.forEach((vertex) => {
        const el = document.createElement("div");
        el.innerHTML = "●";
        el.style.fontSize = "16px";
        el.style.color = "#ff0000";
        el.style.cursor = "move";
        el.style.textShadow = "0 0 2px white";

        const marker = new Marker({ element: el })
          .setLngLat(vertex as [number, number])
          .addTo(map);

        vertexMarkersRef.current.push(marker);
      });
    });
  }, [polygons, ready, isEditing]);

  // האזנה לקליקים וגרירה
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const click = (e: any) => {
      const p: [number, number] = [e.lngLat.lng, e.lngLat.lat];

      if (isDrawing) {
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
        onAddObject({
          id: "local-" + crypto.randomUUID(),
          type: objectType,
          coordinates: p,
        });
      }
    };

    const onDragStart = (e: any) => {
      if (!isEditing) return;

      const point = [e.lngLat.lng, e.lngLat.lat];

      for (let polyIndex = 0; polyIndex < polygons.length; polyIndex++) {
        const polygon = polygons[polyIndex];
        for (
          let vertexIndex = 0;
          vertexIndex < polygon.coordinates[0].length;
          vertexIndex++
        ) {
          const vertex = polygon.coordinates[0][vertexIndex];
          const distance = Math.hypot(
            vertex[0] - point[0],
            vertex[1] - point[1]
          );

          if (distance < 0.001) {
            setDraggingVertex({ polyIndex, vertexIndex });
            map.dragPan.disable();
            return;
          }
        }
      }
    };

    const onDrag = (e: any) => {
      if (!draggingVertex || !isEditing) return;

      const newPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      const { polyIndex, vertexIndex } = draggingVertex;
      const polygonId = polygons[polyIndex].id;

      // צור עותק של הקואורדינטות
      const newCoordinates = [...polygons[polyIndex].coordinates[0]] as [
        number,
        number
      ][];;
      newCoordinates[vertexIndex] = newPoint;

//       // עדכן את הקומפוננט ההורה מיידית
//  const newCoordinates = polygons[polyIndex].coordinates[0] as [
//         number,
//         number
//       ][];

      onUpdatePolygon(polygonId, newCoordinates);    };

    const onDragEnd = () => {
      if (!draggingVertex) return;

      const { polyIndex } = draggingVertex;
      const polygonId = polygons[polyIndex].id;

      // קבל את הקואורדינטות המעודכנות מהמפה
      const currentPolygons = [...polygons];
      const newCoordinates = currentPolygons[polyIndex].coordinates[0] as [
        number,
        number
      ][];

      // שלח את הקואורדינטות המעודכנות להורה
      onUpdatePolygon(polygonId, newCoordinates);

      setDraggingVertex(null);
      map?.dragPan.enable();
    };

    map.on("click", click);
    map.on("mousedown", onDragStart);
    map.on("mousemove", onDrag);
    map.on("mouseup", onDragEnd);

    return () => {
      if (map) {
        map.off("click", click);
        map.off("mousedown", onDragStart);
        map.off("mousemove", onDrag);
        map.off("mouseup", onDragEnd);
      }
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
    updatePolygonsOnMap,
  ]);

  // 🔥 עדכון פוליגונים - מופרד מ-preview
  useEffect(() => {
    if (!ready) return;
    updatePolygonsOnMap(polygons);
  }, [polygons, ready, updatePolygonsOnMap]);

  // 🔥 עדכון preview בנפרד
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
              geometry: {
                type: "LineString",
                coordinates: coords,
              },
            },
          ],
        },
        {
          type: "line",
          paint: {
            "line-color": "#22c55e",
            "line-width": 2,
          },
        }
      );
    } else {
      if (m.getLayer("preview")) m.removeLayer("preview");
      if (m.getSource("preview")) m.removeSource("preview");
    }
  }, [coords, isDrawing, ready, updateOrCreateLayer]);

  // 🔥 עדכון vertex markers בנפרד
  useEffect(() => {
    if (isEditing) {
      updateVertexMarkers();
    } else {
      vertexMarkersRef.current.forEach((m) => m.remove());
      vertexMarkersRef.current = [];
    }
  }, [isEditing, updateVertexMarkers]);

  // עדכון markers לאובייקטים
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    objects.forEach((o) => {
      const el = document.createElement("div");
      el.innerHTML = getEmojiForType(o.type);
      el.style.fontSize = "28px";
      el.style.cursor = "pointer";

      const marker = new Marker({ element: el })
        .setLngLat(o.coordinates)
        .addTo(map);

      markersRef.current.push(marker);

      el.onclick = () => {
        if (isDeletingObjects) {
          onDeleteObject?.(o.id);
        }
      };
    });
  }, [objects, ready, isDeletingObjects, onDeleteObject]);

  // האזנה למחיקת פוליגונים
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

    if (map.getLayer("polygons")) {
      map.on("click", "polygons", handleDeleteClick);
    }

    return () => {
      const map = mapRef.current;
      if (map && map.getLayer("polygons")) {
        map.off("click", "polygons", handleDeleteClick);
      }
    };
  }, [ready, isDeleting, onDeletePolygon]);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100%",
        height: "100%",
        cursor: isDrawing
          ? "crosshair"
          : isAddingObject
          ? "copy"
          : isEditing
          ? "move"
          : "grab",
      }}
    />
  );
};

export default MapView;