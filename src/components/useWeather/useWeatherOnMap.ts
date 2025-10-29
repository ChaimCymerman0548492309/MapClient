// ./hooks/useWeatherOnMap.ts
import { useEffect, useState } from 'react';
import * as maplibregl from 'maplibre-gl';

type UseWeatherOnMapProps = {
  mapRef: React.MutableRefObject<maplibregl.Map | null>;
  ready: boolean;
  polygons: any[];
  weatherMode: boolean;
  fetchAndShowWeather: (coords: [number, number]) => void;
//   checkForNewPolygon: () => void;
};

export const useWeatherOnMap = ({
  mapRef,
  ready,
  polygons,
  weatherMode,
  fetchAndShowWeather,
//   checkForNewPolygon,
}: UseWeatherOnMapProps) => {
  const [popupAnchor, setPopupAnchor] = useState<Element | null>(null);

  // --- click listener for weather mode ---
  useEffect(() => {
    if (!ready || !mapRef.current || !weatherMode) return;
    const map = mapRef.current;

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      if (!weatherMode) return;
      const { lng, lat } = e.lngLat;

      // יצירת anchor זמני לפופאפ
      const fakeAnchor = document.createElement('div');
      fakeAnchor.style.position = 'absolute';
      fakeAnchor.style.left = `${e.point.x}px`;
      fakeAnchor.style.top = `${e.point.y}px`;
      document.body.appendChild(fakeAnchor);

      setPopupAnchor(fakeAnchor);
      fetchAndShowWeather([lng, lat]);
    };

    map.on('click', handleMapClick);
    return () => {
      map.off('click', handleMapClick);
    };
  }, [ready, weatherMode, fetchAndShowWeather]);

//   // --- auto weather for new polygons ---
//   useEffect(() => {
//     if (ready) checkForNewPolygon();
//   }, [ready, polygons, checkForNewPolygon]);

  return { popupAnchor, setPopupAnchor };
};
