/* eslint-disable @typescript-eslint/no-explicit-any */
import { Map, } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState, useMemo,  } from "react";
import "../App.css";



import { cleanupMap, initializeMap } from "./MapManager";
import type { MapObject } from "../types/object.type";
import type { Polygon } from "../types/polygon.type";
import { useMapDrawing } from "../hooks/useMapDrawing";
import { useMapEditing } from "../hooks/useMapEditing";
import { useMapObjects } from "../hooks/useMapObjects";
import { useMapDeleting } from "../hooks/useMapDeleting";
import { useMapFeatures } from "../hooks/useMapFeatures";
import { usePolygonSelection } from "../hooks/usePolygonSelection";

type Props = {
  polygons: Polygon[];
  objects: MapObject[];
  isDrawing: boolean;
  onFinishPolygon: (polygon: Polygon) => void;
  onUpdatePolygon: (id: string, ring: [number, number][]) => void;
  setObjects?: React.Dispatch<React.SetStateAction<MapObject[]>>;
  onAddObject?: (obj: MapObject) => void;
  onDeletePolygon?: (id: string) => void;
  onDeleteObject?: (id: string) => void;
  isAddingObject?: boolean;
  isEditing?: boolean;
  isDeleting?: boolean;
  isDeletingObjects?: boolean;
  isSelectingPolygon?: boolean;
  objectType?: string;
};

const MapView = ({
  polygons,
  objects,
  isDrawing,
  onFinishPolygon,
  onAddObject,
  isAddingObject,
  objectType,
  isEditing,
  onUpdatePolygon,
  isDeleting,
  onDeletePolygon,
  isDeletingObjects,
  onDeleteObject,
  isSelectingPolygon,
  setObjects,
}: Props) => {
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    mapRef.current = initializeMap(containerRef.current, () => setReady(true));
    return () => {
      cleanupMap(mapRef.current);
      mapRef.current = null;
    };
  }, []);

  useMapDrawing({ mapRef, isDrawing, onFinishPolygon });
  useMapEditing({ mapRef, ready, isEditing, polygons, onUpdatePolygon });
  useMapObjects({
    mapRef,
    ready,
    isAddingObject,
    objectType,
    onAddObject,
    isDeletingObjects,
    onDeleteObject,
    objects,
  });
  useMapDeleting({ mapRef, ready, isDeleting, onDeletePolygon });
  useMapFeatures({
    mapRef,
    ready,
    polygons,
    objects,
    isEditing,
    isDeletingObjects,
    onDeleteObject,
  });
  usePolygonSelection({
    mapRef,
    ready,
    isSelecting: !!isSelectingPolygon,
    polygons,
    objects,
    onSelect: (_polyId, inside) =>
      setObjects?.((prev) => prev.filter((o) => !inside.some((i) => i.id === o.id))),
  });

  const cursorClass = useMemo(() => {
    if (isDrawing) return "cursor-draw";
    if (isAddingObject) return "cursor-add";
    if (isEditing) return "cursor-edit";
    return "cursor-grab";
  }, [isDrawing, isAddingObject, isEditing]);

  return <div ref={containerRef} className={`map-container ${cursorClass}`} />;
};

export default MapView;

