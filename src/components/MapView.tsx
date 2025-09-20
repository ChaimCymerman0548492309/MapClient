/* eslint-disable @typescript-eslint/no-explicit-any */
import { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MapObject } from "../types/object.type";
import type { Polygon } from "../types/polygon.type";

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
  const [ready, setReady] = useState(false);
  const [coords, setCoords] = useState<[number, number][]>([]);

  // מיפוי סוג לאימוג'י
  const getEmoji = useCallback((type: string): string => {
    switch (type) {
      case "Marker": return "📍";
      case "Jeep": return "🚙";
      case "Ship": return "🚢";
      case "Plane": return "✈️";
      case "Tree": return "🌳";
      case "Building": return "🏢";
      default: return "❓";
    }
  }, []);

  // יצירת המפה
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

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

    map.on("load", () => setReady(true));
    mapRef.current = map;

    return () => {
      // ניקוי markers
      markersRef.current.forEach((marker) => {
        if (marker.element.parentNode) {
          marker.element.parentNode.removeChild(marker.element);
        }
      });
      markersRef.current = [];

      // ניקוי המפה
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // עדכון מיקומי markers כאשר המפה זזה
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const updateMarkerPositions = () => {
      markersRef.current.forEach((marker) => {
        const projectPoint = map.project(marker.coordinates);
        marker.element.style.left = `${projectPoint.x - 20}px`;
        marker.element.style.top = `${projectPoint.y - 20}px`;
      });
    };

    map.on('move', updateMarkerPositions);
    map.on('zoom', updateMarkerPositions);

    return () => {
      map.off('move', updateMarkerPositions);
      map.off('zoom', updateMarkerPositions);
    };
  }, [ready]);

  // האזנה לקליקים
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    const handleClick = (e: any) => {
      const p: [number, number] = [e.lngLat.lng, e.lngLat.lat];

      if (isDrawing) {
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
      } else if (isAddingObject && onAddObject && objectType) {
        const obj: MapObject = {
          id: "local-" + crypto.randomUUID(),
          type: objectType,
          coordinates: p,
        };
        onAddObject(obj);
      }
    };

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [isDrawing, isAddingObject, coords, ready, onFinishPolygon, onAddObject, objectType]);

  // עדכון שכבות
  const updateLayer = useCallback((id: string, data: any, layer: any) => {
    const m = mapRef.current;
    if (!m || !ready) return;

    if (m.getLayer(id)) m.removeLayer(id);
    if (m.getSource(id)) m.removeSource(id);

    m.addSource(id, { type: "geojson", data });
    m.addLayer({ id, source: id, ...layer });
  }, [ready]);

  // ציור פוליגונים
  useEffect(() => {
    if (!ready) return;

    updateLayer(
      "polygons",
      {
        type: "FeatureCollection",
        features: polygons.map((p) => ({
          type: "Feature",
          properties: {},
          geometry: {
            type: "Polygon",
            coordinates: p.coordinates,
          },
        })),
      },
      {
        type: "fill",
        paint: { "fill-color": "#3b82f6", "fill-opacity": 0.3 },
      }
    );

    const m = mapRef.current;
    if (!m) return;

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
  }, [polygons, coords, isDrawing, ready, updateLayer]);

  // עדכון markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    // ניקוי markers קיימים
    markersRef.current.forEach((marker) => {
      if (marker.element.parentNode) {
        marker.element.parentNode.removeChild(marker.element);
      }
    });
    markersRef.current = [];

    // יצירת markers חדשים
    objects.forEach((obj) => {
      const emoji = getEmoji(obj.type);
      const el = document.createElement("div");
      el.className = `custom-marker ${obj.type.toLowerCase()}`;
      el.dataset.type = obj.type;
      el.dataset.id = obj.id;

      el.innerHTML = `
        <div style="
          font-size: 24px;
        
        ">
          ${emoji}
        </div>
      `;

      const projectPoint = map.project(obj.coordinates);
      el.style.position = "absolute";
      el.style.left = `${projectPoint.x - 20}px`;
      el.style.top = `${projectPoint.y - 20}px`;
      el.style.zIndex = "1000";

      map.getContainer().appendChild(el);

      markersRef.current.push({ element: el, coordinates: obj.coordinates });
    });
  }, [objects, ready, getEmoji]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "100%",
        cursor: isDrawing ? "crosshair" : isAddingObject ? "copy" : "grab",
      }}
    />
  );
};

export default MapView;