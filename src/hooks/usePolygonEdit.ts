// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useEffect, useRef } from "react";
// import { Marker, Map } from "maplibre-gl";
// import type { Polygon } from "../types/polygon.type";

// export const usePolygonEdit = ({
//   mapRef,
//   ready,
//   polygons,
//   editingPolygonId,
//   setEditingPolygonId,
//   onFinishPolygon,
// }: {
//   mapRef: React.MutableRefObject<Map | null>;
//   ready: boolean;
//   polygons: Polygon[];
//   editingPolygonId: string | null;
//   setEditingPolygonId: (id: string | null) => void;
//   onFinishPolygon: (poly: Polygon) => void;
// }) => {
//   const editMarkersRef = useRef<Marker[]>([]);

//   useEffect(() => {
//     const map = mapRef.current;
//     if (!map || !ready || !editingPolygonId) return;

//     editMarkersRef.current.forEach((m) => m.remove());
//     editMarkersRef.current = [];

//     const polygon = polygons.find((p) => p.id === editingPolygonId);
//     if (!polygon) return;

//     polygon.coordinates[0].slice(0, -1).forEach((coord, idx) => {
//       const handle = document.createElement("div");
//       handle.style.cssText = `
//         width: 12px; height: 12px; border-radius: 50%;
//         background: #ff4444; border: 2px solid white; cursor: move;
//       `;

//       const marker = new Marker({ element: handle, draggable: true })
//         .setLngLat(coord as [number, number])
//         .addTo(map);

//       marker.on("dragend", () => {
//         const lngLat = marker.getLngLat();
//         const newCoords = [...polygon.coordinates[0]];
//         newCoords[idx] = [lngLat.lng, lngLat.lat];
//         if (idx === 0) newCoords[newCoords.length - 1] = [lngLat.lng, lngLat.lat];
//         onFinishPolygon({ ...polygon, coordinates: [newCoords] });
//       });

//       editMarkersRef.current.push(marker);
//     });

//     return () => {
//       editMarkersRef.current.forEach((m) => m.remove());
//       editMarkersRef.current = [];
//     };
//   }, [editingPolygonId, polygons, ready, onFinishPolygon, mapRef, setEditingPolygonId]);
// };
