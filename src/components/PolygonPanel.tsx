// PolygonPanel.tsx
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { serverApi } from "../api/api";
import "../App.css";
import type { Polygon } from "../types/polygon.type";

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
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const previousPolygonsRef = useRef<Polygon[]>([]);

  useEffect(() => {
    if (!previousPolygonsRef.current.length) {
      previousPolygonsRef.current = [...polygons];
      return;
    }
    const newEdited = new Set(editedPolygons);
    polygons.forEach((poly) => {
      const prevPoly = previousPolygonsRef.current.find(
        (p) => p.id === poly.id
      );
      if (
        prevPoly &&
        JSON.stringify(poly.coordinates) !==
          JSON.stringify(prevPoly.coordinates)
      ) {
        newEdited.add(poly.id);
      }
    });
    if (newEdited.size !== editedPolygons.size) setEditedPolygons(newEdited);
    previousPolygonsRef.current = [...polygons];
  }, [polygons, setEditedPolygons, editedPolygons]);

  const handleSave = async () => {
    try {
      setSaveStatus("saving");

      // מחיקות
      await Promise.all(
        [...deletedPolygons]
          .filter((id) => !id.startsWith("local-"))
          .map((id) => serverApi.deletePolygon(id))
      );

      // חדשים
      const savedNew = await Promise.all(
        polygons
          .filter((p) => p.id.startsWith("local-"))
          .map(async (p) => {
            const res = await serverApi.addPolygon({
              name: p.name,
              coordinates: p.coordinates,
            });
            return { ...p, id: res.id }; // שומר את הפוליגון עם ה־id האמיתי
          })
      );

      // ערוכים
      const savedEdited = await Promise.all(
        polygons
          .filter((p) => !p.id.startsWith("local-") && editedPolygons.has(p.id))
          .map(async (p) => {
            await serverApi.deletePolygon(p.id);
            const res = await serverApi.addPolygon({
              name: p.name,
              coordinates: p.coordinates,
            });
            return { ...p, id: res.id };
          })
      );

      // עדכון state
      setPolygons((prev) => [
        ...prev.filter(
          (p) =>
            !p.id.startsWith("local-") &&
            !editedPolygons.has(p.id) &&
            !deletedPolygons.has(p.id)
        ),
        ...savedNew,
        ...savedEdited,
      ]);

      // reset
      setEditedPolygons(new Set());
      setDeletedPolygons(new Set());
      previousPolygonsRef.current = polygons;

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  // פונקציה מרכזית לניהול מצבים - כל לחיצה מכבה את השאר
  const handleModeToggle = (mode: "draw" | "edit" | "delete") => {
    // כבה את כל המצבים
    setIsDrawing(false);
    setIsEditing(false);
    setIsDeleting(false);

    // הדלק רק את המצב הנבחר אם הוא לא כבר פעיל
    if (mode === "draw" && !isDrawing) setIsDrawing(true);
    if (mode === "edit" && !isEditing) setIsEditing(true);
    if (mode === "delete" && !isDeleting) setIsDeleting(true);
  };

  const newCount = polygons.filter((p) => p.id.startsWith("local-")).length;
  const editedCount = editedPolygons.size;
  const deletedCount = deletedPolygons.size;
  const totalUnsaved = newCount + editedCount + deletedCount;

  // בדיקה אם יש מצב פעיל כלשהו
  const hasActiveMode = isDrawing || isEditing || isDeleting;

  return (
    <Paper className="pp-root" square>
      <Typography variant="subtitle2" className="pp-title">
        Polygons
      </Typography>

      {saveStatus === "saving" && (
        <Alert severity="info" className="pp-alert">
          Saving...
        </Alert>
      )}
      {saveStatus === "success" && (
        <Alert severity="success" className="pp-alert">
          Saved!
        </Alert>
      )}
      {saveStatus === "error" && (
        <Alert severity="error" className="pp-alert">
          Error
        </Alert>
      )}
      {isDeleting && (
        <Alert severity="error" className="pp-alert">
          Click polygon to delete
        </Alert>
      )}
      {isEditing && (
        <Alert severity="warning" className="pp-alert">
          Edit Mode: Drag points to move
        </Alert>
      )}

      <Box className="pp-stats">
        <Typography variant="caption">Total: {polygons.length}</Typography>
        <Typography
          variant="caption"
          color={totalUnsaved > 0 ? "warning.main" : "success.main"}
        >
          Unsaved: {totalUnsaved}
        </Typography>
        {newCount > 0 && (
          <Typography variant="caption" color="info.main">
            New: {newCount}
          </Typography>
        )}
        {editedCount > 0 && (
          <Typography variant="caption" color="warning.main">
            Edited: {editedCount}
          </Typography>
        )}
        {deletedCount > 0 && (
          <Typography variant="caption" color="error.main">
            Deleted: {deletedCount}
          </Typography>
        )}
        {isEditing && (
          <Chip
            label="EDIT MODE"
            size="small"
            color="warning"
            className="pp-chip"
          />
        )}
      </Box>

      <Stack direction="row" spacing={0.3} className="pp-buttons">
        <Button
          variant={isDrawing ? "contained" : "outlined"}
          color={isDrawing ? "warning" : "primary"}
          size="small"
          onClick={() => handleModeToggle("draw")}
          disabled={hasActiveMode && !isDrawing}
          className="pp-btn"
        >
          {isDrawing ? "Stop Draw Mode" : "Draw Mode"}
        </Button>

        <Button
          variant={isEditing ? "contained" : "outlined"}
          color={isEditing ? "warning" : "primary"}
          size="small"
          onClick={() => handleModeToggle("edit")}
          disabled={hasActiveMode && !isEditing}
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
          onClick={() => handleModeToggle("delete")}
          disabled={polygons.length === 0 || (hasActiveMode && !isDeleting)}
          className="pp-btn"
        >
          {isDeleting ? "Cancel Delete Mode" : "Delete Mode"}
        </Button>
      </Stack>

      {isDrawing && (
        <Alert severity="info" className="pp-alert">
          Click map to draw polygon
        </Alert>
      )}
    </Paper>
  );
};

export default PolygonPanel;
