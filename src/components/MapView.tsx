/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from "react";
import { Map, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { MapObject } from "../types/object.type";
import type { Polygon } from "../types/polygon.type";
import { getEmojiForType, createMarkerElement } from "./MapUtils";

type CustomMarker = {
  element: HTMLDivElement;
  coordinates: [number, number];
};

type Props = {
  polygons: Polygon[];
  objects: MapObject[];
  isDrawing: boolean;
  onFinishPolygon: (polygon: Polygon) => void;
  onAddObject?: (obj: MapObject) => void;
  isAddingObject?: boolean;
  objectType?: string;
};

const MapView = ({
  polygons,
  objects,
  isDrawing,
  onFinishPolygon,
  onAddObject,
  isAddingObject,
  objectType,
}: Props) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const markersRef = useRef<CustomMarker[]>([]);
  const editMarkersRef = useRef<Marker[]>([]);
  const [ready, setReady] = useState(false);
  const [coords, setCoords] = useState<[number, number][]>([]);
  const [editingPolygonId, setEditingPolygonId] = useState<string | null>(null);

  // יצירת המפה
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) {
      return;
    }

    const map = new Map({
      container: mapContainer.current,
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

    map.on("load", () => {
      setReady(true);
    });
    
    mapRef.current = map;

    // פונקציית ניקוי
    return () => {
      // ניקוי markers
      markersRef.current.forEach((marker) => {
        if (marker.element.parentNode) {
          marker.element.parentNode.removeChild(marker.element);
        }
      });
      markersRef.current = [];

      // ניקוי edit markers
      editMarkersRef.current.forEach((marker) => {
        marker.remove();
      });
      editMarkersRef.current = [];

      // ניקוי המפה
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // האזנה לקליקים על פוליגונים לעריכה
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) {
      return;
    }

    const handlePolygonClick = (e: any) => {
      if (isDrawing || isAddingObject) {
        return; // לא לעבוד במצב ציור או הוספת אובייקט
      }
      
      const feature = e.features?.[0];
      if (feature?.geometry?.type === "Polygon") {
        const polygonIndex = e.features.findIndex((f: any) => f.geometry.type === "Polygon");
        if (polygonIndex >= 0 && polygons[polygonIndex]) {
          setEditingPolygonId(polygons[polygonIndex].id);
        }
      }
    };

    // הוספת event listener רק אם השכבה קיימת
    if (map.getLayer("polygons")) {
      map.on("click", "polygons", handlePolygonClick);
    }

    return () => {
      if (map.getLayer("polygons")) {
        map.off("click", "polygons", handlePolygonClick);
      }
    };
  }, [ready, isDrawing, isAddingObject, polygons]);

  // עריכת פוליגון
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !editingPolygonId) {
      return;
    }

    // ניקוי markers עריכה קודמים
    editMarkersRef.current.forEach((m) => m.remove());
    editMarkersRef.current = [];

    const polygon = polygons.find((p) => p.id === editingPolygonId);
    if (!polygon || !polygon.coordinates[0]) {
      return;
    }

    // יצירת handles לעריכה
    polygon.coordinates[0].slice(0, -1).forEach((coord, idx) => { // הסרת הנקודה הכפולה האחרונה
      const handle = document.createElement("div");
      handle.style.cssText = `
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: #ff4444;
        border: 2px solid white;
        cursor: move;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      `;

      const marker = new Marker({
        element: handle,
        draggable: true,
      })
        .setLngLat(coord as [number, number])
        .addTo(map);

      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        const newCoords = [...polygon.coordinates[0]];
        newCoords[idx] = [lngLat.lng, lngLat.lat];
        
        // עדכון הנקודה האחרונה להיות זהה לראשונה (סגירת פוליגון)
        if (idx === 0) {
          newCoords[newCoords.length - 1] = [lngLat.lng, lngLat.lat];
        }

        const updatedPolygon: Polygon = {
          ...polygon,
          coordinates: [newCoords],
        };

        onFinishPolygon(updatedPolygon);
      });

      editMarkersRef.current.push(marker);
    });

    return () => {
      editMarkersRef.current.forEach((m) => m.remove());
      editMarkersRef.current = [];
    };
  }, [editingPolygonId, polygons, ready, onFinishPolygon]);

  // עדכון מיקומי markers כאשר המפה זזה
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) {
      return;
    }

    const updateMarkerPositions = () => {
      markersRef.current.forEach((marker) => {
        const projectPoint = map.project(marker.coordinates);
        marker.element.style.left = `${projectPoint.x - 20}px`;
        marker.element.style.top = `${projectPoint.y - 20}px`;
      });
    };

    map.on("move", updateMarkerPositions);
    map.on("zoom", updateMarkerPositions);

    return () => {
      map.off("move", updateMarkerPositions);
      map.off("zoom", updateMarkerPositions);
    };
  }, [ready]);

  // האזנה לקליקים (ציור פוליגון / הוספת אובייקט)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) {
      return;
    }

    const handleClick = (e: any) => {
      // בדיקה אם לחצנו על פוליגון - אם כן, לא לטפל בקליק
      const features = map.queryRenderedFeatures(e.point);
      const polygonFeature = features.find((f: any) => f.layer?.id === "polygons");
      
      if (polygonFeature && !isDrawing && !isAddingObject) {
        return; // תן לevent של הפוליגון לטפל
      }

      const p: [number, number] = [e.lngLat.lng, e.lngLat.lat];

      if (isDrawing) {
        // סגירת פוליגון
        if (coords.length > 2) {
          const [x1, y1] = coords[0];
          const [x2, y2] = p;
          if (Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2) < 0.001) {
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
        
        // הפסקת עריכה אם בציור
        if (editingPolygonId) {
          setEditingPolygonId(null);
        }
      } else if (isAddingObject && onAddObject && objectType) {
        console.log("Adding object of type:", objectType); // Debug
        
        const obj: MapObject = {
          id: "local-" + crypto.randomUUID(),
          type: objectType,
          coordinates: p,
        };
        onAddObject(obj);
        
        // הפסקת עריכה אם בהוספת אובייקט
        if (editingPolygonId) {
          setEditingPolygonId(null);
        }
      }
    };

    map.on("click", handleClick);
    
    return () => {
      map.off("click", handleClick);
    };
  }, [
    isDrawing,
    isAddingObject,
    coords,
    ready,
    onFinishPolygon,
    onAddObject,
    objectType,
    editingPolygonId,
  ]);

  // עדכון שכבות
  const updateLayer = useCallback(
    (id: string, data: any, layer: any) => {
      const m = mapRef.current;
      if (!m || !ready) {
        return;
      }

      if (m.getLayer(id)) m.removeLayer(id);
      if (m.getSource(id)) m.removeSource(id);

      m.addSource(id, { type: "geojson", data });
      m.addLayer({ id, source: id, ...layer });
    },
    [ready]
  );

  // ציור פוליגונים
  useEffect(() => {
    if (!ready) {
      return;
    }

    updateLayer(
      "polygons",
      {
        type: "FeatureCollection",
        features: polygons.map((p) => ({
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
          "fill-opacity": editingPolygonId ? 0.5 : 0.3 
        },
      }
    );

    const m = mapRef.current;
    if (!m) {
      return;
    }

    if (isDrawing && coords.length > 0) {
      updateLayer(
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
        {
          type: "line",
          paint: { "line-color": "#22c55e", "line-width": 2 },
        }
      );
    } else {
      if (m.getLayer("preview")) m.removeLayer("preview");
      if (m.getSource("preview")) m.removeSource("preview");
    }
  }, [polygons, coords, isDrawing, ready, updateLayer, editingPolygonId]);

  // עדכון markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) {
      return;
    }

    // ניקוי markers קיימים
    markersRef.current.forEach((marker) => {
      if (marker.element.parentNode) {
        marker.element.parentNode.removeChild(marker.element);
      }
    });
    markersRef.current = [];

    // יצירת markers חדשים
    objects.forEach((obj) => {
      console.log("Creating marker for object:", obj.type); // Debug
      
      const emoji = getEmojiForType(obj.type);
      const el = createMarkerElement(obj, emoji);

      const projectPoint = map.project(obj.coordinates);
      el.style.position = "absolute";
      el.style.left = `${projectPoint.x - 20}px`;
      el.style.top = `${projectPoint.y - 20}px`;
      el.style.zIndex = "1000";

      map.getContainer().appendChild(el);
      markersRef.current.push({ element: el, coordinates: obj.coordinates });
    });
  }, [objects, ready]);

  // סגירת מצב עריכה בלחיצה על Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEditingPolygonId(null);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "100%",
        cursor: isDrawing 
          ? "crosshair" 
          : isAddingObject 
          ? "copy" 
          : editingPolygonId 
          ? "pointer"
          : "grab",
      }}
    />
  );
};

export default MapView;