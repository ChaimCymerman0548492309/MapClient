import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { serverApi } from "../api/api";
import "../App.css";
import type { Polygon } from "../types/polygon.type";
import { PolygonButton, StatusAlert } from "../style/PolygonButton";

type Props = {
  isDrawing: boolean;
  setIsDrawing: (v: boolean) => void;
  polygons: Polygon[];
  deletedPolygons: Set<string>;
  setPolygons: React.Dispatch<React.SetStateAction<Polygon[]>>;
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;
  editedPolygons: Set<string>;
  setEditedPolygons: React.Dispatch<React.SetStateAction<Set<string>>>;
  isDeleting: boolean;
  setIsDeleting: (v: boolean) => void;
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
  isDeleting,
  setIsDeleting,
  setDeletedPolygons,
}: Props) => {
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");

  const prevPolygonsRef = useRef<Polygon[]>([]);

  // --- 1️⃣ מעקב אחרי שינויים בפוליגונים (עריכה) ---
  useEffect(() => {
    if (!prevPolygonsRef.current.length) {
      prevPolygonsRef.current = [...polygons];
      return;
    }

    const newEdited = new Set(editedPolygons);

    polygons.forEach((poly) => {
      const prev = prevPolygonsRef.current.find((p) => p.id === poly.id);
      if (prev && JSON.stringify(poly.coordinates) !== JSON.stringify(prev.coordinates)) {
        newEdited.add(poly.id);
      }
    });

    if (newEdited.size !== editedPolygons.size) setEditedPolygons(newEdited);
    prevPolygonsRef.current = [...polygons];
  }, [polygons, editedPolygons, setEditedPolygons]);

  // --- 2️⃣ שמירה לשרת ---
  const handleSave = async () => {
    try {
      setSaveStatus("saving");

      // מחיקה
      await Promise.all(
        [...deletedPolygons]
          .filter((id) => !id.startsWith("local-"))
          .map((id) => serverApi.deletePolygon(id))
      );

      // יצירת חדשים
      const newPolys = await Promise.all(
        polygons
          .filter((p) => p.id.startsWith("local-"))
          .map(async (p) => {
            const res = await serverApi.addPolygon({
              name: p.name,
              coordinates: p.coordinates,
            });
            return { ...p, id: res.id };
          })
      );

      // עדכון ערוכים
      const editedPolys = await Promise.all(
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

      // עדכון סטייט
      setPolygons((prev) => [
        ...prev.filter(
          (p) =>
            !p.id.startsWith("local-") &&
            !editedPolygons.has(p.id) &&
            !deletedPolygons.has(p.id)
        ),
        ...newPolys,
        ...editedPolys,
      ]);

      setEditedPolygons(new Set());
      setDeletedPolygons(new Set());
      prevPolygonsRef.current = polygons;

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  // --- 3️⃣ מעבר בין מצבים (ציור / עריכה / מחיקה) ---
  const handleModeToggle = (mode: "draw" | "edit" | "delete") => {
    setIsDrawing(false);
    setIsEditing(false);
    setIsDeleting(false);

    if (mode === "draw") setIsDrawing(!isDrawing);
    if (mode === "edit") setIsEditing(!isEditing);
    if (mode === "delete") setIsDeleting(!isDeleting);
  };

  // --- 4️⃣ חישובי סטטוס ---
  const newCount = polygons.filter((p) => p.id.startsWith("local-")).length;
  const editedCount = editedPolygons.size;
  const deletedCount = deletedPolygons.size;
  const unsavedCount = newCount + editedCount + deletedCount;
  const activeMode = isDrawing || isEditing || isDeleting;

  // --- 5️⃣ רינדור ---
  return (
    <Paper className="pp-root" square>
      <Typography variant="subtitle2" className="pp-title">
        Polygons
      </Typography>

      {/* Alerts */}
      {saveStatus === "saving" && <StatusAlert type="saving" message="Saving..." />}
      {saveStatus === "success" && <StatusAlert type="success" message="Saved!" />}
      {saveStatus === "error" && <StatusAlert type="error" message="Error saving" />}
      {isDeleting && <StatusAlert type="error" message="Click polygon to delete" />}
      {isEditing && <StatusAlert type="warning" message="Edit Mode: drag points" />}

      {/* Stats */}
      <Box className="pp-stats">
        <Typography variant="caption">Total: {polygons.length}</Typography>
        <Typography
          variant="caption"
          color={unsavedCount > 0 ? "warning.main" : "success.main"}
        >
          Unsaved: {unsavedCount}
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
        {isEditing && <Chip label="EDIT MODE" size="small" color="warning" className="pp-chip" />}
      </Box>

      {/* Buttons */}
      <Stack direction="row" spacing={0.3} className="pp-buttons">
        <PolygonButton mode="draw" isActive={isDrawing} disabled={activeMode && !isDrawing} onClick={() => handleModeToggle("draw")} />
        <PolygonButton mode="edit" isActive={isEditing} disabled={activeMode && !isEditing} onClick={() => handleModeToggle("edit")} />
        <PolygonButton mode="save" disabled={unsavedCount === 0 || saveStatus === "saving"} count={unsavedCount} onClick={handleSave} />
        <PolygonButton mode="delete" isActive={isDeleting} disabled={polygons.length === 0 || (activeMode && !isDeleting)} onClick={() => handleModeToggle("delete")} />
      </Stack>

      {isDrawing && <StatusAlert type="info" message="Click map to draw polygon" />}
    </Paper>
  );
};

export default PolygonPanel;
