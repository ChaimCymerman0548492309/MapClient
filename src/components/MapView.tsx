/* eslint-disable @typescript-eslint/no-explicit-any */
import { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useRef, useState } from "react";
import "../App.css";

import { useMapDeleting } from "../hooks/useMapDeleting";
import { useMapDrawing } from "../hooks/useMapDrawing";
import { useMapEditing } from "../hooks/useMapEditing";
import { useMapFeatures } from "../hooks/useMapFeatures";
import { useMapObjects } from "../hooks/useMapObjects";
import { usePolygonSelection } from "../hooks/usePolygonSelection";

import { cleanupMap, initializeMap } from "./MapManager";

import type { MapObject } from "../types/object.type";
import type { Polygon } from "../types/polygon.type";

type Props = {
  polygons: Polygon[];
  objects: MapObject[];
  isDrawing: boolean;
  isAddingObject?: boolean;
  objectType?: string;
  isEditing?: boolean;
  isDeleting?: boolean;
  onFinishPolygon: (polygon: Polygon) => void;
  onAddObject?: (obj: MapObject) => void;
  onUpdatePolygon: (polygonId: string, newRing: [number, number][]) => void;
  onDeletePolygon?: (id: string) => void;
  isDeletingObjects?: boolean;
  isSelectingPolygon?: boolean;
  onDeleteObject?: (id: string) => void;
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
}: Props) => {
  /** refs */
  const mapRef = useRef<Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /** local state */
  const [ready, setReady] = useState(false);

  /** initialize map */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = initializeMap(containerRef.current, () => setReady(true));
    mapRef.current = map;

    return () => {
      cleanupMap(mapRef.current);
      mapRef.current = null;
    };
  }, []);

  /** hooks */
  useMapDrawing({ mapRef, isDrawing, onFinishPolygon });
  useMapEditing({
    mapRef,
    ready,
    isEditing,
    polygons,
    onUpdatePolygon,
  });
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
    isSelecting: isSelectingPolygon || false,
    polygons,
    objects,
    onSelect: (polyId, inside) => {
      console.log("Polygon clicked:", polyId, inside);
      // setObjects((prev) => prev.filter((o) => !inside.some((i) => i.id === o.id)));
    },
  });

  /** cursor */
  const getCursorClass = () => {
    if (isDrawing) return "cursor-draw";
    if (isAddingObject) return "cursor-add";
    if (isEditing) return "cursor-edit";
    return "cursor-grab";
  };

  return (
    <div ref={containerRef} className={`map-container ${getCursorClass()}`} />
  );
};

export default MapView;
