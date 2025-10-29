/* eslint-disable @typescript-eslint/no-explicit-any */
// MapManager.ts
// import { Map } from 'maplibre-gl';
import { closeRing } from './MapUtils';
import maplibregl, {  Map as MapLibreMap, Marker, type GeoJSONSource } from 'maplibre-gl';

/**
 * Initialize a new map with OSM tiles
 */
export const initializeMap = (container: HTMLDivElement, onReady: () => void): MapLibreMap => {
  const map = new maplibregl.Map({
    container,
    style: {
      version: 8,
      sources: {
        osm: {
          type: 'raster',
          tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
        },
      },
      layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
    },
    center: [34.78, 32.07],
    zoom: 12,
  });

  map.once('load', () => onReady?.());
  return map;
};

/**
 * Create or update a GeoJSON layer
 */
export const updateOrCreateLayer = (map: MapLibreMap, id: string, data: any, layer: any): void => {
  const source = map.getSource(id) as GeoJSONSource | undefined;
  if (source) {
    source.setData(data);
  } else {
    map.addSource(id, { type: 'geojson', data });
    map.addLayer({ id, source: id, ...layer });
  }
};

/**
 * Remove a layer and its source
 */
export const removeLayer = (map?: MapLibreMap | null, id?: string): void => {
  if (!map || typeof map.getLayer !== 'function' || !id) return;

  try {
    if (map.getLayer(id)) map.removeLayer(id);
    if (map.getSource(id)) map.removeSource(id);
  } catch (e) {
    console.warn(`removeLayer: failed to remove layer ${id}`, e);
  }
};

/**
 * Update polygons layer using GeoJSON (safe)
 */
export const updatePolygonsLayer = (map: MapLibreMap, polygons: any[]): void => {
  const features = polygons
    .filter((p) => Array.isArray(p.coordinates) && p.coordinates[0]?.length >= 3) // לפחות 3 נקודות
    .map((p) => ({
      type: 'Feature',
      properties: { id: p.id },
      geometry: {
        type: 'Polygon',
        coordinates: [closeRing(p.coordinates[0])],
      },
    }));

  updateOrCreateLayer(
    map,
    'polygons',
    {
      type: 'FeatureCollection',
      features,
    },
    {
      type: 'fill',
      paint: { 'fill-color': '#3b82f6', 'fill-opacity': 0.3 },
    },
  );
};

/**
 * Update drawing preview (polyline while drawing)
 */
export const updateDrawingPreview = (map: MapLibreMap, coords: [number, number][]): void => {
  if (!coords.length) {
    removeLayer(map, 'preview');
    return;
  }

  updateOrCreateLayer(
    map,
    'preview',
    {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: coords },
        },
      ],
    },
    { type: 'line', paint: { 'line-color': '#22c55e', 'line-width': 2 } },
  );
};

/**
 * Create a map marker for objects
 */
export const createObjectMarker = (
  map: MapLibreMap,
  object: any,
  getEmojiForType: (type: string) => string,
  onDelete?: (id: string) => void,
  isDeleting?: boolean,
): Marker => {
  const el = document.createElement('div');
  el.innerHTML = getEmojiForType(object.type);
  el.className = 'map-marker';

  const marker = new Marker({ element: el }).setLngLat(object.coordinates).addTo(map);

  if (isDeleting && onDelete) {
    el.onclick = () => onDelete(object.id);
  }

  return marker;
};

/**
 * Create a small vertex marker for polygon editing
 */
export const createVertexMarker = (map: MapLibreMap, vertex: [number, number], options?: { color?: string }): Marker => {
  const el = document.createElement('div');
  el.style.width = '10px';
  el.style.height = '10px';
  el.style.borderRadius = '50%';
  el.style.backgroundColor = options?.color ?? 'blue';
  el.style.border = '2px solid white';

  return new Marker({ element: el }).setLngLat(vertex).addTo(map);
};

/**
 * Cleanup map resources
 */
export const cleanupMap = (map: MapLibreMap | null): void => {
  if (!map) return;
  map.remove();
};
