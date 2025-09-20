/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState, useCallback } from "react";
import { Map, Marker } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Polygon } from "../types/polygon.type";
import type { MapObject } from "../types/object.type";
import { getEmojiForType } from "./MapUtils";

type Props = {
  polygons: Polygon[];
  objects: MapObject[];
  isDrawing: boolean;
  onFinishPolygon: (p: Polygon) => void;
  onAddObject?: (o: MapObject) => void;
  isAddingObject?: boolean;
  objectType?: string;
};

const MapView = ({ polygons, objects, isDrawing, onFinishPolygon, onAddObject, isAddingObject, objectType }: Props) => {
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<Marker[]>([]);
  const [ready, setReady] = useState(false);
  const [coords, setCoords] = useState<[number, number][]>([]);

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
            tileSize: 256 
          } 
        }, 
        layers: [{ 
          id: "osm", 
          type: "raster", 
          source: "osm" 
        }] 
      },
      center: [34.78, 32.07], 
      zoom: 12
    });
    
    map.on("load", () => setReady(true));
    mapRef.current = map;
    
    return () => { 
      markersRef.current.forEach(m => m.remove()); 
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // האזנה לקליקים
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
        setCoords(prev => [...prev, p]);
      } else if (isAddingObject && onAddObject && objectType) {
        onAddObject({
          id: "local-" + crypto.randomUUID(),
          type: objectType,
          coordinates: p,
        });
      }
    };

    map.on("click", click);
    
    return () => {
      if (map) {
        map.off("click", click);
      }
    };
  }, [coords, isDrawing, isAddingObject, onFinishPolygon, onAddObject, objectType, ready]);

  // עדכון שכבות
  const updateLayer = useCallback((id: string, data: any, layer: any) => {
    const m = mapRef.current; 
    if (!m || !ready) return;
    
    if (m.getLayer(id)) m.removeLayer(id); 
    if (m.getSource(id)) m.removeSource(id);
    
    m.addSource(id, { type: "geojson", data }); 
    m.addLayer({ id, source: id, ...layer });
  }, [ready]);

  // עדכון פוליגונים
  useEffect(() => {
    if (!ready) return;
    
    updateLayer(
      "polygons", 
      { 
        type: "FeatureCollection", 
        features: polygons.map(p => ({ 
          type: "Feature", 
          geometry: { 
            type: "Polygon", 
            coordinates: p.coordinates 
          } 
        })) 
      }, 
      { 
        type: "fill", 
        paint: { 
          "fill-color": "#3b82f6", 
          "fill-opacity": 0.3 
        } 
      }
    );

    const m = mapRef.current; 
    if (!m) return;
    
    if (isDrawing && coords.length) {
      updateLayer(
        "preview", 
        { 
          type: "FeatureCollection", 
          features: [{ 
            type: "Feature", 
            geometry: { 
              type: "LineString", 
              coordinates: coords 
            } 
          }] 
        }, 
        { 
          type: "line", 
          paint: { 
            "line-color": "#22c55e", 
            "line-width": 2 
          } 
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
    
    markersRef.current.forEach(m => m.remove()); 
    markersRef.current = [];
    
    objects.forEach(o => {
      const el = document.createElement("div"); 
      el.innerHTML = getEmojiForType(o.type); 
      el.style.fontSize = "28px";
      el.style.cursor = "pointer";
      
      const marker = new Marker({ element: el })
        .setLngLat(o.coordinates)
        .addTo(map);
      
      markersRef.current.push(marker);
    });
  }, [objects, ready]);

  return (
    <div 
      ref={containerRef} 
      style={{ 
        width: "100%", 
        height: "100%", 
        cursor: isDrawing ? "crosshair" : isAddingObject ? "copy" : "grab" 
      }} 
    />
  );
};

export default MapView;