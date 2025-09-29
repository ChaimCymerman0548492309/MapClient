// utils/getObjectsInPolygon.ts
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point, polygon } from "@turf/helpers";
import type { MapObject } from "../types/object.type";

/**
 * מחזיר את כל האובייקטים שנמצאים בתוך פוליגון
 * @param objects  רשימת האובייקטים עם { id, type, coordinates }
 * @param polygonCoords  מערך קואורדינטות של הפוליגון [[lng,lat], [lng,lat], ...]
 */
export function getObjectsInPolygon(
  objects: MapObject[],
  polygonCoords: [number, number][]
): MapObject[] {
  // יוצר GeoJSON Polygon
  const poly = polygon([polygonCoords]);

  // מסנן את האובייקטים
  return objects.filter(obj => {
    const pt = point(obj.coordinates); // יוצר GeoJSON Point
    return booleanPointInPolygon(pt, poly); // בדיקה מול הפוליגון
  });
}
