// import type { PolygonApiResponse, Polygon } from "../types/polygon.type";

// export function normalizePolygon(p: PolygonApiResponse): Polygon {
//   const coords = p.geometry.coordinates.exterior.positions.map(
//     (pos) => pos.values
//   );

//   return {
//     id: p.id,
//     name: p.name,
//     coordinates: [coords], // GeoJSON דורש עטיפה נוספת
//   };
// }
