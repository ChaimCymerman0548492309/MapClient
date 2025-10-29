import * as maplibregl from 'maplibre-gl';
import { Map } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, useState } from 'react';
import '../App.css';

import { useMapDeleting } from '../hooks/useMapDeleting';
import { useMapDrawing } from '../hooks/useMapDrawing';
import { useMapEditing } from '../hooks/useMapEditing';
import { useMapFeatures } from '../hooks/useMapFeatures';
import { useMapObjects } from '../hooks/useMapObjects';
import { usePolygonSelection } from '../hooks/usePolygonSelection';
import type { MapObject } from '../types/object.type';
import type { Polygon } from '../types/polygon.type';
import { cleanupMap, initializeMap } from './MapManager';
import { useWeatherForecast } from './useWeather/useWeatherForecast';
import { useWeatherOnMap } from './useWeather/useWeatherOnMap';
import { WeatherControls } from './useWeather/WeatherControls';
import { WeatherPopup } from './useWeather/WeatherPopup/WeatherPopup';
import type { Feature, LineString } from 'geojson';

type Props = {
  polygons: Polygon[];
  objects: MapObject[];
  isDrawing: boolean;
  onFinishPolygon: (polygon: Polygon) => void;
  onUpdatePolygon: (id: string, ring: [number, number][]) => void;
  setObjects?: React.Dispatch<React.SetStateAction<MapObject[]>>;
  onAddObject?: (obj: MapObject) => void;
  onDeletePolygon?: (id: string) => void;
  onDeleteObject?: (id: string) => void;
  isAddingObject?: boolean;
  isEditing?: boolean;
  isDeleting?: boolean;
  isDeletingObjects?: boolean;
  isSelectingPolygon?: boolean;
  objectType?: string;
  showWeatherOnClick?: boolean;
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
  isSelectingPolygon,
  setObjects,
}: Props) => {
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // ✅ מערך כתובות לדוגמה (עד 10 כתובות)
  const addresses: string[] = ['קניון עופר, פתח תקווה, ישראל', 'מגדלי עזריאלי, תל אביב, ישראל', 'נמל תל אביב, ישראל'];

  // --- Weather Forecast Hook ---
  const {
    weatherMode,
    toggleWeatherMode,
    showWeatherForPolygon,
    // showWeatherForLastPolygon,
    fetchAndShowWeather,
    // checkForNewPolygon,
    popupOpen,
    popupData,
    closePopup,
    loadingWx,
    errorWx,
  } = useWeatherForecast({
    mapRef,
    polygons,
    ready,
  });
  const { popupAnchor, setPopupAnchor } = useWeatherOnMap({
    mapRef,
    ready,
    polygons,
    weatherMode,
    fetchAndShowWeather,
    // checkForNewPolygon,
  });

  // --- init / cleanup map ---
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = initializeMap(containerRef.current, () => setReady(true));
    return () => {
      cleanupMap(mapRef.current);
      mapRef.current = null;
    };
  }, []);

useEffect(() => {
  if (!ready || !mapRef.current) return;

  const routeSourceId = 'route';

  const loadRoute = async () => {
    try {
      // 1. מיקום נוכחי
      const startCoord: [number, number] = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve([pos.coords.longitude, pos.coords.latitude]),
          (err) => reject(err),
        );
      });

      const coords: [number, number][] = [startCoord];

      // 2. גיאוקודינג כתובות
      for (const address of addresses) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (data?.[0]) {
          coords.push([parseFloat(data[0].lon), parseFloat(data[0].lat)]);
        }
      }

      if (coords.length < 2) return;

      // 3. קריאה ל־OSRM
      const coordsQuery = coords.map((c) => c.join(',')).join(';');
      const routeUrl = `https://router.project-osrm.org/route/v1/driving/${coordsQuery}?overview=full&geometries=geojson`;
      const res = await fetch(routeUrl);
      const routeData = await res.json();
      if (!routeData.routes?.length) return;

      const routeFeature: GeoJSON.Feature<GeoJSON.LineString> = {
        type: 'Feature',
        geometry: routeData.routes[0].geometry,
        properties: {},
      };

      // 4. יצירת מקור ושכבה
      const map = mapRef.current;
      if (!map) return;
      const source = map.getSource(routeSourceId) as maplibregl.GeoJSONSource | undefined;

      if (source) {
        source.setData(routeFeature);
      } else {
        map.addSource(routeSourceId, { type: 'geojson', data: routeFeature });
        map.addLayer({
          id: 'route-layer',
          type: 'line',
          source: routeSourceId,
          layout: { 'line-cap': 'round', 'line-join': 'round' },
          paint: { 'line-color': '#3b9ddd', 'line-width': 5 },
        });
      }

      // 5. התאמת תצוגה
      const bounds = coords.reduce((b, c) => b.extend(c), new maplibregl.LngLatBounds(coords[0], coords[0]));
      map.fitBounds(bounds, { padding: 50 });
    } catch (e) {
      console.error('Error loading route:', e);
    }
  };

  loadRoute();
}, [ready]);


  // --- hooks you already use ---
  useMapDrawing({ mapRef, isDrawing, onFinishPolygon });
  useMapEditing({ mapRef, ready, isEditing, polygons, onUpdatePolygon });
  useMapObjects({
    mapRef,
    ready,
    isAddingObject,
    objectType,
    onAddObject,
    isDeletingObjects,
    onDeleteObject,
    objects,
  });
  useMapDeleting({ mapRef, ready, isDeleting, onDeletePolygon });
  useMapFeatures({
    mapRef,
    ready,
    polygons,
    objects,
    isEditing,
    isDeletingObjects,
    onDeleteObject,
  });
  usePolygonSelection({
    mapRef,
    ready,
    isSelecting: !!isSelectingPolygon,
    polygons,
    objects,
    onSelect: (_polyId, inside) => {
      return setObjects?.((prev) => prev.filter((o) => !inside.some((i) => i.id === o.id)));
    },
  });

  // --- helpers ---
  const cursorClass = () => {
    if (weatherMode) return 'cursor-weather';
    if (isDrawing) return 'cursor-draw';
    if (isAddingObject) return 'cursor-add';
    if (isEditing) return 'cursor-edit';
    if (isDeleting) return 'cursor-delete';
    return 'cursor-grab';
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <div ref={containerRef} className={`map-container ${cursorClass()}`} />
      {/* ✅ Weather Popup של MUI */}
      <WeatherPopup
        open={popupOpen}
        onClose={() => {
          closePopup();
          if (popupAnchor) {
            document.body.removeChild(popupAnchor);
            setPopupAnchor(null);
          }
        }}
        daily={popupData.daily}
        loading={loadingWx}
        error={errorWx}
        position={popupData.position}
        anchorEl={popupAnchor}
      />
      {/* ✅ כפתורים להפעלת תחזית */}
      <WeatherControls
        weatherMode={weatherMode}
        toggleWeatherMode={toggleWeatherMode}
        // showWeatherForLastPolygon={showWeatherForLastPolygon}
        polygons={polygons}
        showWeatherForPolygon={showWeatherForPolygon}
      />
    </div>
  );
};

export default MapView;
