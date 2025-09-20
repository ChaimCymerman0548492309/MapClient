import { useEffect } from "react";
import { Map } from "maplibre-gl";

export const useMapInit = (
  mapContainer: React.RefObject<HTMLDivElement>,
  mapRef: React.MutableRefObject<Map | null>,
  setReady: (val: boolean) => void
) => {
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
        layers: [{ id: "osm", type: "raster", source: "osm" }],
      },
      center: [34.78, 32.07],
      zoom: 12,
    });

    map.on("load", () => setReady(true));
    mapRef.current = map;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapContainer, mapRef, setReady]);
};
