/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Map } from 'maplibre-gl';
import { useCallback, useState } from 'react';
import type { Polygon } from '../../types/polygon.type';

export type DailyForecast = {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_probability_max?: number[];
  wind_speed_10m_max?: number[];
};

type UseWeatherForecastProps = {
  mapRef: React.RefObject<Map | null>;
  polygons: Polygon[];
  ready: boolean;
};

export const useWeatherForecast = ({
  //   mapRef,
  polygons,
  ready,
}: UseWeatherForecastProps) => {
  const [loadingWx, setLoadingWx] = useState(false);
  const [errorWx, setErrorWx] = useState<string | null>(null);
  const [weatherMode, setWeatherMode] = useState(false);
  const [lastPolygonId, setLastPolygonId] = useState<string | null>(null);

  // ✅ State עבור ה-popup של MUI
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupData, setPopupData] = useState<{
    daily: DailyForecast | null;
    position: { lng: number; lat: number } | null;
  }>({ daily: null, position: null });

  // ✅ פונקציות לניהול ה-popup
  const openPopup = useCallback((daily: DailyForecast | null, position: { lng: number; lat: number }) => {
    setPopupData({ daily, position });
    setPopupOpen(true);
  }, []);

  const closePopup = useCallback(() => {
    setPopupOpen(false);
    setPopupData({ daily: null, position: null });
  }, []);

  // ✅ קריאה ל-Open-Meteo
  const fetchForecast = async (lat: number, lon: number): Promise<DailyForecast> => {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', lat.toString());
    url.searchParams.set('longitude', lon.toString());
    url.searchParams.set(
      'daily',
      ['temperature_2m_max', 'temperature_2m_min', 'precipitation_probability_max', 'wind_speed_10m_max'].join(',')
    );
    url.searchParams.set('forecast_days', '7');
    url.searchParams.set('timezone', 'auto');


    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.daily as DailyForecast;
  };

  // ✅ הצגת תחזית
  const fetchAndShowWeather = useCallback(
    async (lngLat: [number, number]) => {
      setErrorWx(null);
      setLoadingWx(true);

      try {
        const daily = await fetchForecast(lngLat[1], lngLat[0]);
        openPopup(daily, { lng: lngLat[0], lat: lngLat[1] });
      } catch (e: any) {
        setErrorWx(e?.message || 'שגיאה בטעינת תחזית');
        openPopup(null, { lng: lngLat[0], lat: lngLat[1] });
      } finally {
        setLoadingWx(false);
      }
    },
    [openPopup]
  );

  // ✅ פונקציה שממירה את הפורמט coordinates לפורמט ring
  const getRingFromPolygon = useCallback((polygon: Polygon): [number, number][] => {
    if (!polygon.coordinates || !polygon.coordinates[0]) {
      console.warn('Invalid polygon coordinates:', polygon);
      return [];
    }

    const ring = polygon.coordinates[0].map((coord) => [coord[0], coord[1]] as [number, number]);
    return ring;
  }, []);

  // ✅ צנטרואיד טבעי של טבעת פוליגון [lng,lat]
  const centroidOfRing = useCallback((ring: [number, number][]): [number, number] => {
    if (!ring || ring.length === 0) return [0, 0];

    const pts =
      ring.length > 1 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
        ? ring.slice(0, ring.length - 1)
        : ring;

    if (pts.length === 0) return [0, 0];
    if (pts.length === 1) return pts[0];

    let twiceArea = 0;
    let cx = 0;
    let cy = 0;

    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [x0, y0] = pts[j];
      const [x1, y1] = pts[i];
      const f = x0 * y1 - x1 * y0;
      twiceArea += f;
      cx += (x0 + x1) * f;
      cy += (y0 + y1) * f;
    }

    if (Math.abs(twiceArea) < 1e-12) {
      const avgLng = pts.reduce((sum, pt) => sum + pt[0], 0) / pts.length;
      const avgLat = pts.reduce((sum, pt) => sum + pt[1], 0) / pts.length;
      return [avgLng, avgLat];
    }

    const area6 = twiceArea * 3;
    return [cx / area6, cy / area6];
  }, []);

  // ✅ הפעל/כבה מצב תחזית
  const toggleWeatherMode = useCallback(() => {
    if (weatherMode) {
      closePopup();
    }
    setWeatherMode(!weatherMode);
  }, [weatherMode, closePopup]);

  // ✅ הצגת תחזית לפוליגון ספציפי
  const showWeatherForPolygon = useCallback(
    (polygonId: string) => {
      const polygon = polygons.find((p) => p.id === polygonId);
      if (!polygon) {
        alert('פוליגון לא נמצא');
        return;
      }

      const ring = getRingFromPolygon(polygon);
      if (!ring || ring.length < 3) {
        alert('פוליגון לא תקין');
        return;
      }

      const [lng, lat] = centroidOfRing(ring);
      fetchAndShowWeather([lng, lat]);
    },
    [polygons, getRingFromPolygon, centroidOfRing, fetchAndShowWeather]
  );

  // // ✅ הצגת תחזית לפוליגון האחרון
  // const showWeatherForLastPolygon = useCallback(() => {
  //   if (polygons.length === 0) {
  //     alert('אין פוליגונים להצגת תחזית');
  //     return;
  //   }

  //   const lastPolygon = polygons[polygons.length - 1];
  //   const ring = getRingFromPolygon(lastPolygon);

  //   if (!ring || ring.length < 3) {
  //     alert('פוליגון לא תקין');
  //     return;
  //   }

  //   const [lng, lat] = centroidOfRing(ring);
  //   fetchAndShowWeather([lng, lat]);
  // }, [polygons, getRingFromPolygon, centroidOfRing, fetchAndShowWeather]);

  // // ✅ בדיקה אם נוסף פוליגון חדש והצגת תחזית אוטומטית
  // const checkForNewPolygon = useCallback(() => {
  //   if (!ready || polygons.length === 0) return;

  //   const lastPolygon = polygons[polygons.length - 1];
  //   if (!lastPolygon || lastPolygon.id === lastPolygonId) return;


  //   // עדכן את ID האחרון
  //   setLastPolygonId(lastPolygon.id);

  //   // קבל את הקואורדינטות מהפוליגון בפורמט הנכון
  //   const ring = getRingFromPolygon(lastPolygon);

  //   if (!ring || ring.length < 3) {
  //     console.warn('Invalid ring coordinates:', ring);
  //     return;
  //   }

  //   const [lng, lat] = centroidOfRing(ring);

  //   fetchAndShowWeather([lng, lat]);
  // }, [ready, polygons, lastPolygonId, getRingFromPolygon, centroidOfRing, fetchAndShowWeather]);

  return {
    loadingWx,
    errorWx,
    weatherMode,
    popupOpen,
    popupData,
    toggleWeatherMode,
    showWeatherForPolygon,
    // showWeatherForLastPolygon,
    fetchAndShowWeather,
    // checkForNewPolygon,
    closePopup,
  };
};
