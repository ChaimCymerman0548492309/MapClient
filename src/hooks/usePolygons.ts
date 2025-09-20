// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { useCallback, useEffect } from "react";
// import type { Map } from "maplibre-gl";
// import type { Polygon } from "../types/polygon.type";

// export const usePolygons = ({
//   mapRef,
//   ready,
//   polygons,
//   isDrawing,
//   coords,
// //   setCoords,
// //   onFinishPolygon,
// }: {
//   mapRef: React.MutableRefObject<Map | null>;
//   ready: boolean;
//   polygons: Polygon[];
//   isDrawing: boolean;
//   coords: [number, number][];
//   setCoords: React.Dispatch<React.SetStateAction<[number, number][]>>;
//   onFinishPolygon: (poly: Polygon) => void;
// }) => {
//   const updateLayer = useCallback(
//     (id: string, data: any, layer: any) => {
//       const m = mapRef.current;
//       if (!m || !ready) return;
//       if (m.getLayer(id)) m.removeLayer(id);
//       if (m.getSource(id)) m.removeSource(id);
//       m.addSource(id, { type: "geojson", data });
//       m.addLayer({ id, source: id, ...layer });
//     },
//     [mapRef, ready]
//   );

//   // ציור שכבות
//   useEffect(() => {
//     if (!ready) return;

//     updateLayer(
//       "polygons",
//       {
//         type: "FeatureCollection",
//         features: polygons.map((p) => ({
//           type: "Feature",
//           properties: { id: p.id },
//           geometry: { type: "Polygon", coordinates: p.coordinates },
//         })),
//       },
//       { type: "fill", paint: { "fill-color": "#3b82f6", "fill-opacity": 0.3 } }
//     );

//     const m = mapRef.current;
//     if (!m) return;

//     if (isDrawing && coords.length > 0) {
//       updateLayer(
//         "preview",
//         {
//           type: "FeatureCollection",
//           features: [{ type: "Feature", geometry: { type: "LineString", coordinates: coords } }],
//         },
//         { type: "line", paint: { "line-color": "#22c55e", "line-width": 2 } }
//       );
//     } else {
//       if (m.getLayer("preview")) m.removeLayer("preview");
//       if (m.getSource("preview")) m.removeSource("preview");
//     }
//   }, [polygons, coords, isDrawing, ready, updateLayer]);
// };
