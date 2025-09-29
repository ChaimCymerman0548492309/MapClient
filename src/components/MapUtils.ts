import type { MapObject } from "../types/object.type";

export const getEmojiForType = (type: string): string => {
  const t = type?.toLowerCase().trim();
  switch (t) {
    case "marker": case "מרקר": return "📍";
    case "jeep": case "ג'יפ": case "car": case "רכב": return "🚙";
    case "ship": case "ספינה": case "boat": case "סירה": return "🚢";
    case "plane": case "מטוס": case "aircraft": case "airplane": return "✈️";
    case "tree": case "עץ": return "🌳";
    case "building": case "בניין": case "house": case "בית": return "🏢";
    case "person": case "אדם": case "people": return "🚶";
    case "tank": case "טנק": return "🚗";
    case "helicopter": case "מסוק": return "🚁";
    default: return "❓";
  }
};

export const createMarkerElement = (obj: MapObject, emoji: string): HTMLDivElement => {
  const el = document.createElement("div");
  el.className = `custom-marker ${obj.type.toLowerCase()}`;
  el.dataset.type = obj.type;
  el.dataset.id = obj.id;
  el.title = `${obj.type} (ID: ${obj.id})`;
  el.innerHTML = `<div style="font-size:28px;line-height:1;cursor:pointer;">${emoji}</div>`;
  el.onmouseenter = () => (el.firstElementChild as HTMLElement).style.transform = "scale(1.1)";
  el.onmouseleave = () => (el.firstElementChild as HTMLElement).style.transform = "scale(1)";
  return el;
};



export function closeRing(coords: Array<[number, number]>): Array<[number, number]> {
  if (coords.length === 0) return coords;
  const [first] = coords;
  const last = coords[coords.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    return [...coords, first];
  }
  return coords;
}
