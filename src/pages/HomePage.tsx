import {
  //  Button, 
   Paper, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import "../App.css";
import MapDataTable from "../components/MapDataTable";
import { closeRing } from "../components/MapUtils";
import MapView from "../components/MapView";
import ObjectsPanel from "../components/ObjectsPanel";
import PolygonPanel from "../components/PolygonPanel";
import type { MapObject, MapObjectApiResponse } from "../types/object.type";
import type { Polygon, PolygonApiResponse } from "../types/polygon.type";
import { serverApi } from "../api/api";


const HomePage = () => {
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [objects, setObjects] = useState<MapObject[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingObject, setIsAddingObject] = useState(false);
  const [objectType, setObjectType] = useState("Marker");
  const [editedPolygons, setEditedPolygons] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletedPolygons, setDeletedPolygons] = useState<Set<string>>(
    new Set()
  );
  const [isDeletingObjects, setIsDeletingObjects] = useState(false);
  const [deletedObjects, setDeletedObjects] = useState<Set<string>>(new Set());
  const [isSelectingPolygon, 
    // setIsSelectingPolygon
  ] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const polyRes: PolygonApiResponse[] = await serverApi.getPolygons();
        setPolygons(
          polyRes.map((p) => ({
            id: p.id,
            name: p.name,
            coordinates: [
              p.geometry.coordinates.exterior.positions.map((pos) => [
                pos.values[0],
                pos.values[1],
              ]),
            ],
          }))
        );

        const objRes: MapObjectApiResponse[] = await serverApi.getObjects();
        setObjects(
          objRes.map((o) => ({
            id: o.id,
            type: o.type,
            coordinates: [
              o.location.coordinates.longitude,
              o.location.coordinates.latitude,
            ],
          }))
        );
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    })();
  }, []);

  return (
    <div className="hp-root">
      <div className="hp-left">
        {/* <Button onClick={() => setIsSelectingPolygon((prev) => !prev)}>
          {isSelectingPolygon ? "בטל בחירה" : "בחר פוליגון"}
        </Button> */}

        <Paper className="hp-paper" square>
          <Typography variant="h6" className="hp-header">
            Map
          </Typography>
          <div className="hp-map">
            <MapView
              setObjects={setObjects}
              polygons={polygons}
              objects={objects}
              isDrawing={isDrawing}
              isAddingObject={isAddingObject}
              objectType={objectType}
              isEditing={isEditing}
              isDeleting={isDeleting}
              isSelectingPolygon={isSelectingPolygon}
              onFinishPolygon={(poly) => {
                const ring: [number, number][] = poly.coordinates[0] as [
                  number,
                  number
                ][];
                const fixed = {
                  ...poly,
                  id: "local-" + crypto.randomUUID(), // תמיד ייחודי
                  coordinates: [closeRing(ring)], // לוודא סגירה
                };
                setPolygons((prev) => [...prev, fixed]);
                setIsDrawing(false);
              }}
              onAddObject={(obj) =>
                setObjects((prev) => {
                  if (prev.some((o) => o.id === obj.id)) return prev; // כבר קיים
                  return [...prev, obj];
                })
              }
              onUpdatePolygon={(polygonId, newRing: [number, number][]) => {
                const fixedRing = closeRing(newRing);
                setPolygons((prev) =>
                  prev.map((poly) =>
                    poly.id === polygonId
                      ? { ...poly, coordinates: [fixedRing] }
                      : poly
                  )
                );
                setEditedPolygons((prev) => new Set(prev).add(polygonId));
              }}
              onDeletePolygon={(polygonId) => {
                setPolygons((prev) => prev.filter((p) => p.id !== polygonId));
                setDeletedPolygons((prev) => new Set(prev).add(polygonId));
              }}
              isDeletingObjects={isDeletingObjects}
              onDeleteObject={(id) => {
                setObjects((prev) => prev.filter((o) => o.id !== id));
                setDeletedObjects((prev) => {
                  const next = new Set(prev);
                  next.add(id);
                  return next;
                });
              }}
            />
          </div>
        </Paper>
      </div>

      <div className="hp-right">
        <Paper className="hp-panel" square>
          <PolygonPanel
            isDrawing={isDrawing}
            setIsDrawing={setIsDrawing}
            polygons={polygons}
            setPolygons={setPolygons}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
            editedPolygons={editedPolygons}
            setEditedPolygons={setEditedPolygons}
            isDeleting={isDeleting}
            setIsDeleting={setIsDeleting}
            deletedPolygons={deletedPolygons}
            setDeletedPolygons={setDeletedPolygons}
          />
        </Paper>

        <Paper className="hp-panel" square>
          <ObjectsPanel
            objects={objects}
            setObjects={setObjects}
            isAdding={isAddingObject}
            setIsAdding={setIsAddingObject}
            objectType={objectType}
            setObjectType={setObjectType}
            isDeletingObjects={isDeletingObjects}
            setIsDeletingObjects={setIsDeletingObjects}
            deletedObjects={deletedObjects}
            setDeletedObjects={setDeletedObjects}
          />
        </Paper>

        <Paper className="hp-data" square>
          <MapDataTable
            polygons={polygons}
            objects={objects}
            setObjects={setObjects}
            setPolygons={setPolygons}
          />
        </Paper>
      </div>
    </div>
  );
};

export default HomePage;
