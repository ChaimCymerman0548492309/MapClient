// PolygonPanel.tsx
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { serverApi } from "../api/api";
import type { Polygon } from "../types/polygon.type";
import "../App.css";

type Props = {
  isDrawing: boolean;
  setIsDrawing: (val: boolean) => void;
  polygons: Polygon[];
  deletedPolygons: Set<string>;
  setPolygons: React.Dispatch<React.SetStateAction<Polygon[]>>;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  editedPolygons: Set<string>;
  setEditedPolygons: React.Dispatch<React.SetStateAction<Set<string>>>;
  isDeleting: boolean;
  setIsDeleting: (val: boolean) => void;
  setDeletedPolygons: React.Dispatch<React.SetStateAction<Set<string>>>;
};

const PolygonPanel = ({
  isDrawing,
  setIsDrawing,
  polygons,
  deletedPolygons,
  setPolygons,
  isEditing,
  setIsEditing,
  editedPolygons,
  setEditedPolygons,
  setDeletedPolygons,
  isDeleting,
  setIsDeleting,
}: Props) => {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const previousPolygonsRef = useRef<Polygon[]>([]);

  useEffect(() => {
    if (!previousPolygonsRef.current.length) {
      previousPolygonsRef.current = [...polygons];
      return;
    }
    const newEdited = new Set(editedPolygons);
    polygons.forEach((poly) => {
      const prevPoly = previousPolygonsRef.current.find((p) => p.id === poly.id);
      if (prevPoly && JSON.stringify(poly.coordinates) !== JSON.stringify(prevPoly.coordinates)) {
        newEdited.add(poly.id);
      }
    });
    if (newEdited.size !== editedPolygons.size) setEditedPolygons(newEdited);
    previousPolygonsRef.current = [...polygons];
  }, [polygons, setEditedPolygons, editedPolygons]);

  const handleSave = async () => {
    try {
      setSaveStatus("saving");
      for (const id of deletedPolygons) if (!id.startsWith("local-")) await serverApi.deletePolygon(id);
      const newPolygons = polygons.filter((p) => p.id.startsWith("local-"));
      const savedNew = await Promise.all(
        newPolygons.map((poly) => serverApi.addPolygon({ name: poly.name, coordinates: poly.coordinates }))
      );
      const editedExisting = polygons.filter((p) => !p.id.startsWith("local-") && editedPolygons.has(p.id));
      const savedEdited = await Promise.all(
        editedExisting.map(async (poly) => {
          await serverApi.deletePolygon(poly.id);
          return serverApi.addPolygon({ name: poly.name, coordinates: poly.coordinates });
        })
      );
      setPolygons((prev) => {
        const updated = prev.filter(
          (p) => !p.id.startsWith("local-") && !editedPolygons.has(p.id) && !deletedPolygons.has(p.id)
        );
        savedNew.forEach((poly) => poly && updated.push(poly));
        savedEdited.forEach((poly) => poly && updated.push(poly));
        return updated;
      });
      setEditedPolygons(new Set());
      setDeletedPolygons(new Set());
      setTimeout(() => (previousPolygonsRef.current = [...polygons]), 100);
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isDrawing) setIsDrawing(false);
  };

  const newCount = polygons.filter((p) => p.id.startsWith("local-")).length;
  const editedCount = editedPolygons.size;
  const deletedCount = deletedPolygons.size;
  const totalUnsaved = newCount + editedCount + deletedCount;

  return (
    <Paper className="pp-root" square>
      <Typography variant="subtitle2" className="pp-title">Polygons</Typography>

      {saveStatus === "saving" && <Alert severity="info" className="pp-alert">Saving...</Alert>}
      {saveStatus === "success" && <Alert severity="success" className="pp-alert">Saved!</Alert>}
      {saveStatus === "error" && <Alert severity="error" className="pp-alert">Error</Alert>}
      {isDeleting && <Alert severity="error" className="pp-alert">Click polygon to delete</Alert>}
      {isEditing && <Alert severity="warning" className="pp-alert">Edit Mode: Drag points to move</Alert>}

      <Box className="pp-stats">
        <Typography variant="caption">Total: {polygons.length}</Typography>
        <Typography variant="caption" color={totalUnsaved > 0 ? "warning.main" : "success.main"}>
          Unsaved: {totalUnsaved}
        </Typography>
        {newCount > 0 && <Typography variant="caption" color="info.main">New: {newCount}</Typography>}
        {editedCount > 0 && <Typography variant="caption" color="warning.main">Edited: {editedCount}</Typography>}
        {deletedCount > 0 && <Typography variant="caption" color="error.main">Deleted: {deletedCount}</Typography>}
        {isEditing && <Chip label="EDIT MODE" size="small" color="warning" className="pp-chip" />}
      </Box>

      <Stack direction="row" spacing={0.3} className="pp-buttons">
        <Button
          variant={isDrawing ? "contained" : "outlined"}
          color={isDrawing ? "warning" : "primary"}
          size="small"
          onClick={() => setIsDrawing(!isDrawing)}
          disabled={isEditing}
          className="pp-btn"
        >
          {isDrawing ? "Stop Draw Mode" : "Draw Mode"}
        </Button>

        <Button
          variant={isEditing ? "contained" : "outlined"}
          color={isEditing ? "warning" : "primary"}
          size="small"
          onClick={handleEditToggle}
          disabled={isDrawing}
          className="pp-btn"
        >
          {isEditing ? "Stop Edit Mode" : "Edit Mode"}
        </Button>

        <Button
          variant="contained"
          color="success"
          size="small"
          onClick={handleSave}
          disabled={totalUnsaved === 0 || saveStatus === "saving"}
          className="pp-btn"
        >
          Save ({totalUnsaved})
        </Button>

        <Button
          variant={isDeleting ? "contained" : "outlined"}
          color={isDeleting ? "warning" : "error"}
          size="small"
          onClick={() => {
            setIsDeleting(!isDeleting);
            if (isDrawing) setIsDrawing(false);
            if (isEditing) setIsEditing(false);
          }}
          disabled={polygons.length === 0}
          className="pp-btn"
        >
          {isDeleting ? "Cancel Delete Mode" : "Delete Mode"}
        </Button>
      </Stack>

      {isDrawing && <Alert severity="info" className="pp-alert">Click map to draw polygon</Alert>}
    </Paper>
  );
};

export default PolygonPanel;
