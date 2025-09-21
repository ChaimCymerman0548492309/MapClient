import { Paper, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { serverApi } from "../api/api";
import MapDataTable from "../components/MapDataTable";
import MapView from "../components/MapView";
import ObjectsPanel from "../components/ObjectsPanel";
import PolygonPanel from "../components/PolygonPanel";
import type { MapObject, MapObjectApiResponse } from "../types/object.type";
import type { Polygon, PolygonApiResponse } from "../types/polygon.type";

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ---- POLYGONS ----
        const polyRes: PolygonApiResponse[] = await serverApi.getPolygons();
        setPolygons(
          polyRes.map((p) => ({
            id: p.id,
            name: p.name,
            coordinates: [
              p.geometry.coordinates.exterior.positions.map((pos) => {
                // pos.values = [lon, lat]
                return [pos.values[0], pos.values[1]];
              }),
            ],
          }))
        );

        // ---- OBJECTS ----
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
    };

    fetchData();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      {/* Map - Left Side */}
      <div
        style={{
          flex: "3",
          height: "100%",
          borderRight: "1px solid black",
        }}
      >
        <Paper
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            borderRadius: 0,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              borderBottom: "1px solid black",
              p: 1,
              backgroundColor: "primary.main",
              color: "white",
            }}
          >
            Map
          </Typography>
          <div style={{ flex: 1, width: "100%" }}>
            <MapView
              polygons={polygons}
              objects={objects}
              isDrawing={isDrawing}
              isAddingObject={isAddingObject}
              objectType={objectType}
              isEditing={isEditing}
              isDeleting={isDeleting}
              onFinishPolygon={(poly) => {
                setPolygons((prev) => [...prev, poly]);
                setIsDrawing(false);
              }}
              onAddObject={(obj) => setObjects((prev) => [...prev, obj])}
              onUpdatePolygon={(polygonId, newRing) => {
                setPolygons((prev) =>
                  prev.map((poly) =>
                    poly.id === polygonId
                      ? { ...poly, coordinates: [newRing] }
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
                // 👇 מחיקה מיידית מה־objects
                setObjects((prev) => prev.filter((o) => o.id !== id));

                // 👇 הוספה לסט מחיקות
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

      {/* Panels - Right Side */}
      <div
        style={{
          flex: "1",
          minWidth: "300px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Objects Panel - גובה יחסי 1 */}
        <Paper
          sx={{
            flex: 1,
            borderBottom: "1px solid black",
            p: 1,
            borderRadius: 0,
            minHeight: 0, // חשוב לגמישות
          }}
        >
          <ObjectsPanel
            objects={objects}
            setObjects={setObjects}
            isAdding={isAddingObject}
            setIsAdding={setIsAddingObject}
            objectType={objectType}
            setObjectType={setObjectType}
            isDeletingObjects={isDeletingObjects} // 👈 חדש
            setIsDeletingObjects={setIsDeletingObjects} // 👈 חדש
            deletedObjects={deletedObjects} // 👈 חדש
            setDeletedObjects={setDeletedObjects} // ‚‚👈 חדש
          />
        </Paper>
        {/* Polygon Panel - גובה יחסי 1 */}
        <Paper
          sx={{
            flex: 1,
            borderBottom: "1px solid black",
            p: 1,
            borderRadius: 0,
            minHeight: 0, // חשוב לגמישות
          }}
        >
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
        {/* Map Data Panel - גובה יחסי 2 */}
        <Paper
          sx={{
            flex: 1,
            p: 1,
            overflow: "auto",
            borderRadius: 0,
            minHeight: 0, // חשוב לגמישות
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            {/* 4 Map Data */}
          </Typography>
          <MapDataTable
            polygons={polygons}
            objects={objects}
            setObjects={setObjects}
            setPolygons={setPolygons}
          />{" "}
        </Paper>
      </div>
    </div>
  );
};

export default HomePage;
