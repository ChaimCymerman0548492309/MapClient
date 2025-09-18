/* eslint-disable @typescript-eslint/no-explicit-any */
import maplibregl, { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import type { MapObject } from "../types/object.type";
import type { Polygon } from "../types/polygon.type";

type Props = {
  polygons: Polygon[];
  objects: MapObject[];
  isDrawing: boolean;
  onFinishPolygon: (polygon: Polygon) => void;
};

const MapView = ({ polygons, objects, isDrawing, onFinishPolygon }: Props) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<Map | null>(null);
  const [ready, setReady] = useState(false);
  const [coords, setCoords] = useState<[number, number][]>([]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return undefined;
    
    const map = new maplibregl.Map({
      container: mapContainer.current,
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
      zoom: 12,
    });
    
    map.on("load", () => setReady(true));
    mapRef.current = map;

    // Cleanup function - חייבת להחזיר void
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || !isDrawing) return undefined;
    
    const click = (e: any) => {
      const p: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      if (coords.length > 2) {
        const [x1, y1] = coords[0]; 
        const [x2, y2] = p;
        if (Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2) < 0.001) {
          onFinishPolygon({ 
            id: "local-" + crypto.randomUUID(), 
            name: "Polygon", 
            coordinates: [[...coords, coords[0]]] 
          });
          setCoords([]); 
          return;
        }
      }
      setCoords((prev) => [...prev, p]);
    };
    
    map.on("click", click);
    return () => {
      map.off("click", click);
    };
  }, [isDrawing, coords, ready, onFinishPolygon]);

  const update = (id: string, data: any, layer: any) => {
    const m = mapRef.current; 
    if (!m || !ready) return;
    
    if (m.getLayer(id)) m.removeLayer(id); 
    if (m.getSource(id)) m.removeSource(id);
    
    m.addSource(id, { type: "geojson", data }); 
    m.addLayer({ id, source: id, ...layer });
  };

  useEffect(() => {
    if (!ready) return undefined;
    
    update("polygons", { 
      type: "FeatureCollection", 
      features: polygons.map((p) => ({ 
        type: "Feature", 
        properties: {}, 
        geometry: { 
          type: "Polygon", 
          coordinates: p.coordinates 
        } 
      })) 
    }, { 
      type: "fill", 
      paint: { 
        "fill-color": "#3b82f6", 
        "fill-opacity": 0.3 
      } 
    });
    
    update("objects", { 
      type: "FeatureCollection", 
      features: objects.map((o) => ({ 
        type: "Feature", 
        geometry: { 
          type: "Point", 
          coordinates: o.coordinates 
        } 
      })) 
    }, { 
      type: "circle", 
      paint: { 
        "circle-radius": 6, 
        "circle-color": "#f43f5e" 
      } 
    });
    
    if (isDrawing && coords.length) {
      update("preview", { 
        type: "FeatureCollection", 
        features: [{ 
          type: "Feature", 
          geometry: { 
            type: "LineString", 
            coordinates: coords 
          } 
        }] 
      }, { 
        type: "line", 
        paint: { 
          "line-color": "#22c55e", 
          "line-width": 2 
        } 
      });
    } else {
      const m = mapRef.current; 
      if (!m) return;
      
      if (m.getLayer("preview")) m.removeLayer("preview"); 
      if (m.getSource("preview")) m.removeSource("preview");
    }

    return undefined;
  }, [polygons, objects, coords, isDrawing, ready]);

  return <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />;
};

export default MapView;