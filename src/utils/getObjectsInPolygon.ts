import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point, polygon } from "@turf/helpers";
import type { MapObject } from "../types/object.type";


export function getObjectsInPolygon(
  objects: MapObject[],
  polygonCoords: [number, number][]
): MapObject[] {
  // יוצר GeoJSON Polygon
  const poly  = polygon([polygonCoords]);

  return objects.filter(obj => {
    const pt = point(obj.coordinates); // יוצר GeoJSON Point
    return booleanPointInPolygon(pt, poly); // בדיקה מול הפוליגון
  });
}
