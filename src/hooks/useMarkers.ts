// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useEffect, useRef } from "react";
// import type { Map } from "maplibre-gl";
// import type { MapObject } from "../types/object.type";
// import { createMarkerElement, getEmojiForType } from "../components/MapUtils";
// // import type { MapObject } from "../../types/object.type";
// // import { getEmojiForType, createMarkerElement } from "../MapUtils";
// /* eslint-disable @typescript-eslint/no-explicit-any */
// // import { useEffect, useRef } from "react";
// import { Marker } from "maplibre-gl";

// export const useMarkers = ({
//   mapRef,
//   ready,
//   objects,
// }: {
//   mapRef: React.MutableRefObject<Map | null>;
//   ready: boolean;
//   objects: MapObject[];
// }) => {
//   const markersRef = useRef<Marker[]>([]);

//   useEffect(() => {
//     const map = mapRef.current;
//     if (!map || !ready) return;

//     // נקה markers קיימים
//     markersRef.current.forEach((m) => m.remove());
//     markersRef.current = [];

//     // צור markers חדשים
//     objects.forEach((obj) => {
//       const emoji = getEmojiForType(obj.type);
//       const el = createMarkerElement(obj, emoji);

//       const marker = new Marker({ element: el })
//         .setLngLat(obj.coordinates)
//         .addTo(map);

//       markersRef.current.push(marker);
//     });
//   }, [objects, ready, mapRef]);
// };
