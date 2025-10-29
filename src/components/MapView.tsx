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
