// // helper/mapper.ts
// import type { Polygon, PolygonApiResponse } from "../types/polygon.type";

// export function mapPolygonApiResponseToPolygon(p: PolygonApiResponse): Polygon {
//   return {
//     id: p.id,
//     name: p.name,
//     coordinates: [
//       p.geometry.coordinates.exterior.positions.map((pos) => pos.values),
//     ],
//   };
// }

