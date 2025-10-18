import {
  //  Button,
  Paper,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { serverApi } from "../api/api";
import "../App.css";
import MapDataTable from "../components/MapDataTable";
import MapView from "../components/MapView";
import ObjectsPanel from "../components/ObjectsPanel";
import PolygonPanel from "../components/PolygonPanel";
import type { MapObject, MapObjectApiResponse } from "../types/object.type";
import type { Polygon, PolygonApiResponse } from "../types/polygon.type";
import {

  handleFinishPolygon,
  handleAddObject,
  handleUpdatePolygon,
  handleDeletePolygon,
  handleDeleteObject,
} from "../components/MapUtils";

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
  const [
    isSelectingPolygon,
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
              polygons={polygons}
              objects={objects}
              setObjects={setObjects}
              isDrawing={isDrawing}
              isAddingObject={isAddingObject}
              objectType={objectType}
              isEditing={isEditing}
              isDeleting={isDeleting}
              isSelectingPolygon={isSelectingPolygon}
              isDeletingObjects={isDeletingObjects}
              onFinishPolygon={(poly) =>
                handleFinishPolygon(poly, setPolygons, setIsDrawing)
              }
              onAddObject={(obj) => handleAddObject(obj, setObjects)}
              onUpdatePolygon={(id, ring) =>
                handleUpdatePolygon(id, ring, setPolygons, setEditedPolygons)
              }
              onDeletePolygon={(id) =>
                handleDeletePolygon(id, setPolygons, setDeletedPolygons)
              }
              onDeleteObject={(id) =>
                handleDeleteObject(id, setObjects, setDeletedObjects)
              }
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
