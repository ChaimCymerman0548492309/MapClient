/* eslint-disable @typescript-eslint/no-explicit-any */
import type { MapObject } from "../types/object.type";
import type { Polygon } from "../types/polygon.type";

export const getEmojiForType = (type: string): string => {
  const t = type?.toLowerCase().trim();
  switch (t) {
    case "marker":
    case "מרקר":
      return "📍";
    case "jeep":
    case "ג'יפ":
    case "car":
    case "רכב":
      return "🚙";
    case "ship":
    case "ספינה":
    case "boat":
    case "סירה":
      return "🚢";
    case "plane":
    case "מטוס":
    case "aircraft":
    case "airplane":
      return "✈️";
    case "tree":
    case "עץ":
      return "🌳";
    case "building":
    case "בניין":
    case "house":
    case "בית":
      return "🏢";
    case "person":
    case "אדם":
    case "people":
      return "🚶";
    case "tank":
    case "טנק":
      return "🚗";
    case "helicopter":
    case "מסוק":
      return "🚁";
    default:
      return "❓";
  }
};

export const createMarkerElement = (
  obj: MapObject,
  emoji: string
): HTMLDivElement => {
  const el = document.createElement("div");
  el.className = `custom-marker ${obj.type.toLowerCase()}`;
  el.dataset.type = obj.type;
  el.dataset.id = obj.id;
  el.title = `${obj.type} (ID: ${obj.id})`;
  el.innerHTML = `<div style="font-size:28px;line-height:1;cursor:pointer;">${emoji}</div>`;
  el.onmouseenter = () =>
    ((el.firstElementChild as HTMLElement).style.transform = "scale(1.1)");
  el.onmouseleave = () =>
    ((el.firstElementChild as HTMLElement).style.transform = "scale(1)");
  return el;
};

export function closeRing(
  coords: Array<[number, number]>
): Array<[number, number]> {
  if (coords.length === 0) return coords;
  const [first] = coords;
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    return [...coords, first];
  }
  return coords;
}

// כדי להשתמש בהם יש להעביר את setX כפונקציות מבחוץ (לא ניגשים ל-state ישירות)
export const handleFinishPolygon = (
  poly: any,
  setPolygons: React.Dispatch<React.SetStateAction<Polygon[]>>,
  setIsDrawing: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const ring = poly.coordinates[0] as [number, number][];
  setPolygons((p) => [
    ...p,
    {
      ...poly,
      id: `local-${crypto.randomUUID()}`,
      coordinates: [closeRing(ring)],
    },
  ]);
  setIsDrawing(false);
};

export const handleAddObject = (
  obj: MapObject,
  setObjects: React.Dispatch<React.SetStateAction<MapObject[]>>
) => setObjects((p) => (p.some((o) => o.id === obj.id) ? p : [...p, obj]));

export const handleUpdatePolygon = (
  polygonId: string,
  newRing: [number, number][],
  setPolygons: React.Dispatch<React.SetStateAction<Polygon[]>>,
  setEditedPolygons: React.Dispatch<React.SetStateAction<Set<string>>>
) => {
  const fixed = closeRing(newRing);
  setPolygons((p) =>
    p.map((poly) =>
      poly.id === polygonId ? { ...poly, coordinates: [fixed] } : poly
    )
  );
  setEditedPolygons((s) => new Set(s).add(polygonId));
};

export const handleDeletePolygon = (
  polygonId: string,
  setPolygons: React.Dispatch<React.SetStateAction<Polygon[]>>,
  setDeletedPolygons: React.Dispatch<React.SetStateAction<Set<string>>>
) => {
  setPolygons((p) => p.filter((poly) => poly.id !== polygonId));
  setDeletedPolygons((s) => new Set(s).add(polygonId));
};

export const handleDeleteObject = (
  id: string,
  setObjects: React.Dispatch<React.SetStateAction<MapObject[]>>,
  setDeletedObjects: React.Dispatch<React.SetStateAction<Set<string>>>
) => {
  setObjects((p) => p.filter((o) => o.id !== id));
  setDeletedObjects((s) => new Set(s).add(id));
};
