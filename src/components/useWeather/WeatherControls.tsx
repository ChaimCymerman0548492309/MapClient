import { centerOfMass } from '@turf/center-of-mass';
import { polygon } from '@turf/helpers';
import React, { useEffect, useState } from 'react';
import type { Polygon } from '../../types/polygon.type';
import { fetchLocationName } from '../MapUtils';

interface WeatherControlsProps {
  weatherMode: boolean;
  toggleWeatherMode: () => void;
  // showWeatherForLastPolygon: () => void;
  polygons: Polygon[];
  showWeatherForPolygon: (id: string) => void;
}

export const WeatherControls: React.FC<WeatherControlsProps> = ({
  weatherMode,
  toggleWeatherMode,
  // showWeatherForLastPolygon,
  polygons,
  showWeatherForPolygon,
}) => {
  const [polygonNames, setPolygonNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchPolygonNames = async () => {
      const names: Record<string, string> = {};

      for (const polygonItem of polygons) {
        try {
          if (polygonItem.coordinates) {
            // המרת קואורדינטות לפורמט Turf (lat, lon)
            // const turfCoords = polygonItem.coordinates[0].map(([lon, lat]) => [lat, lon]);
            // const turfPolygon = polygon([turfCoords]);

            // חישוב מרכז המסה של הפוליגון
            const center = centerOfMass(polygon(polygonItem.coordinates));
            const [lng, lat] = center.geometry.coordinates;

            // בקשת שם המקום
            const name = await fetchLocationName(lat, lng);
            // console.log("🚀 ~ fetchPolygonNames ~ name:", name)
            if (name) names[polygonItem.id] = name;
          }
        } catch (error) {
          console.error(`Error calculating center for polygon ${polygonItem.id}:`, error);
        }
      }

      setPolygonNames(names);
    };

    if (polygons.length > 0) fetchPolygonNames();
  }, [polygons]);

  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        gap: '5px',
      }}>
      <button
        onClick={toggleWeatherMode}
        style={{
          padding: '8px 12px',
          backgroundColor: weatherMode ? '#4CAF50' : '#2196F3',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '12px',
        }}>
        {weatherMode ? '❌ כבה תחזית' : '🌤️ תחזית בלחיצה'}
      </button>

      {/* <button
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
        📍 תחזית לאזור אחרון
      </button> */}

      {polygons.length > 0 && (
        <div
          style={{
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: '8px',
            borderRadius: '4px',
            maxHeight: '200px',
            overflowY: 'auto',
          }}>
          <div style={{ display: 'grid', gap: '4px', width: '200px' }}>
            {polygons.map((poly) => (
              <button
                key={poly.id}
                onClick={() => showWeatherForPolygon(poly.id)}
                style={{
                  background: '#9C27B0',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '3px',
                  padding: '4px',
                  fontSize: '11px',
                  cursor: 'pointer',
                }}>
                {polygonNames[poly.id] || `אזור ${poly.id.slice(0, 6)}`}
              </button>
            ))}
          </div>
        </div>
      )}
      {weatherMode && (
        <div
          style={{
            backgroundColor: 'rgba(255,255,255,0.9)',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            textAlign: 'center',
          }}>
          🎯 לחץ על המפה לתחזית
        </div>
      )}
    </div>
  );
};
