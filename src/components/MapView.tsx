import * as maplibregl from "maplibre-gl";
import { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import "../App.css";

import { useMapDeleting } from "../hooks/useMapDeleting";
import { useMapDrawing } from "../hooks/useMapDrawing";
import { useMapEditing } from "../hooks/useMapEditing";
import { useMapFeatures } from "../hooks/useMapFeatures";
import { useMapObjects } from "../hooks/useMapObjects";
import { usePolygonSelection } from "../hooks/usePolygonSelection";
import type { MapObject } from "../types/object.type";
import type { Polygon } from "../types/polygon.type";
import { cleanupMap, initializeMap } from "./MapManager";
import { useWeatherForecast } from "./useWeather/useWeatherForecast";
import { WeatherPopup } from "./useWeather/WeatherPopup/WeatherPopup";
// import { WeatherPopup } from "./useWeather/WeatherPopup";

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
  // בתוך ה-MapView component
  const [popupAnchor, setPopupAnchor] = useState<Element | null>(null);

  // --- Weather Forecast Hook ---
  const {
    weatherMode,
    toggleWeatherMode,
    showWeatherForPolygon,
    showWeatherForLastPolygon,
    fetchAndShowWeather,
    checkForNewPolygon,
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

  // --- Weather click listener ---
  useEffect(() => {
    if (!ready || !mapRef.current || !weatherMode) return;

    const map = mapRef.current;

    // בתוך ה-useEffect של weather click listener
    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      if (!weatherMode) return;

      const { lng, lat } = e.lngLat;

      // יצירת element זמני כ-anchor
      const fakeAnchor = document.createElement("div");
      fakeAnchor.style.position = "absolute";
      fakeAnchor.style.left = `${e.point.x}px`;
      fakeAnchor.style.top = `${e.point.y}px`;
      document.body.appendChild(fakeAnchor);

      setPopupAnchor(fakeAnchor);
      fetchAndShowWeather([lng, lat]);
    };

    map.on("click", handleMapClick);

    return () => {
      map.off("click", handleMapClick);
    };
  }, [ready, weatherMode, fetchAndShowWeather]);

  // --- Auto weather for new polygons ---
  useEffect(() => {
    checkForNewPolygon();
  }, [polygons, ready, checkForNewPolygon]);

  // --- helpers ---
  const cursorClass = () => {
    if (weatherMode) return "cursor-weather";
    if (isDrawing) return "cursor-draw";
    if (isAddingObject) return "cursor-add";
    if (isEditing) return "cursor-edit";
    if (isDeleting) return "cursor-delete";
    return "cursor-grab";
  };

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
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
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: "5px",
        }}
      >
        <button
          onClick={toggleWeatherMode}
          style={{
            padding: "8px 12px",
            backgroundColor: weatherMode ? "#4CAF50" : "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          {weatherMode ? "❌ כבה תחזית" : "🌤️ תחזית בלחיצה"}
        </button>

        <button
          onClick={showWeatherForLastPolygon}
          style={{
            padding: "8px 12px",
            backgroundColor: "#FF9800",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          📍 תחזית לפוליגון אחרון
        </button>

        {/* ✅ כפתורים לכל הפוליגונים */}
        {polygons.length > 0 && (
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.9)",
              padding: "8px",
              borderRadius: "4px",
              maxHeight: "200px",
              overflowY: "auto",
            }}
          >
            <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "5px" }}>תחזית לפוליגון:</div>
            {polygons.map((polygon) => (
              <button
                key={polygon.id}
                onClick={() => showWeatherForPolygon(polygon.id)}
                style={{
                  padding: "4px 8px",
                  backgroundColor: "#9C27B0",
                  color: "white",
                  border: "none",
                  borderRadius: "3px",
                  cursor: "pointer",
                  fontSize: "11px",
                  margin: "2px",
                  width: "100%",
                  textAlign: "right",
                }}
              >
                {polygon.name || `פוליגון ${polygon.id.slice(0, 6)}`}
              </button>
            ))}
          </div>
        )}

        {weatherMode && (
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.9)",
              padding: "8px",
              borderRadius: "4px",
              fontSize: "12px",
              textAlign: "center",
            }}
          >
            🎯 לחץ על המפה לתחזית
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
