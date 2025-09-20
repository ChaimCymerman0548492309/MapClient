import { useEffect } from "react";
import { Map } from "maplibre-gl";
import type { MapObject } from "../types/object.type";
import { createMarkerElement, getEmojiForType } from "../components/MapUtils";

type CustomMarker = { element: HTMLDivElement; coordinates: [number, number] };

export const useMarkers = ({
  mapRef,
  ready,
  objects,
}: {
  mapRef: React.MutableRefObject<Map | null>;
  ready: boolean;
  objects: MapObject[];
}) => {
  const markersRef = ([] as CustomMarker[]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    markersRef.forEach((m) => m.element.remove());
    markersRef.length = 0;

    objects.forEach((obj) => {
      const emoji = getEmojiForType(obj.type);
      const el = createMarkerElement(obj, emoji);

      const pt = map.project(obj.coordinates);
      el.style.position = "absolute";
      el.style.left = `${pt.x - 20}px`;
      el.style.top = `${pt.y - 20}px`;

      map.getContainer().appendChild(el);
      markersRef.push({ element: el, coordinates: obj.coordinates });
    });
  }, [objects, ready, mapRef]);
};
