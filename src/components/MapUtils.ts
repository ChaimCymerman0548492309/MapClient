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

export const MapHelpers = {
  calculateDistance: ([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]) => {
    const R = 6371e3, φ1 = lat1 * Math.PI / 180, φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180, Δλ = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(Δφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(Δλ/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  },
  isPointInPolygon: ([x, y]: [number, number], poly: [number, number][]) => {
    let inside = false;
    for (let i=0,j=poly.length-1;i<poly.length;j=i++) {
      const [xi, yi] = poly[i], [xj, yj] = poly[j];
      if ((yi>y)!==(yj>y) && x < (xj-xi)*(y-yi)/(yj-yi)+xi) inside = !inside;
    }
    return inside;
  },
  getPolygonCenter: (coords: [number, number][]) => {
    const l = coords.length-1;
    return [
      coords.slice(0,l).reduce((s,c)=>s+c[0],0)/l,
      coords.slice(0,l).reduce((s,c)=>s+c[1],0)/l
    ] as [number,number];
  }
};

export const MapConfig = {
  DEFAULT_CENTER: [34.78, 32.07] as [number, number],
  DEFAULT_ZOOM: 12,
  MIN_POLYGON_POINTS: 3,
  POLYGON_CLOSE_THRESHOLD: 0.001,
  COLORS: { POLYGON_FILL:"#3b82f6", POLYGON_FILL_OPACITY:0.3, POLYGON_EDIT_OPACITY:0.5, PREVIEW_LINE:"#22c55e", EDIT_HANDLE:"#ff4444" },
  SIZES: { MARKER_SIZE:40, EDIT_HANDLE_SIZE:12, PREVIEW_LINE_WIDTH:2 }
};
