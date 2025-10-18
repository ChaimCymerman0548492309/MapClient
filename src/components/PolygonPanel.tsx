// PolygonPanel.tsx
import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { serverApi } from "../api/api";
import "../App.css";
import type { Polygon } from "../types/polygon.type";
import { PolygonButton, StatusAlert ,  } from "../style/PolygonButton";

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

  // Track polygon changes for edit detection
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

  // Save all changes to server
  const handleSave = async () => {
    try {
      setSaveStatus("saving");

      // Delete removed polygons
      await Promise.all(
        [...deletedPolygons]
          .filter((id) => !id.startsWith("local-"))
          .map((id) => serverApi.deletePolygon(id))
      );

      // Create new polygons
      const savedNew = await Promise.all(
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

      // Update edited polygons
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

      // Update local state
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

      // Reset change tracking
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

  // Toggle between modes (mutually exclusive)
  const handleModeToggle = (mode: "draw" | "edit" | "delete") => {
    setIsDrawing(false);
    setIsEditing(false);
    setIsDeleting(false);

    if (mode === "draw" && !isDrawing) setIsDrawing(true);
    if (mode === "edit" && !isEditing) setIsEditing(true);
    if (mode === "delete" && !isDeleting) setIsDeleting(true);
  };

  // Calculate change counts
  const newCount = polygons.filter((p) => p.id.startsWith("local-")).length;
  const editedCount = editedPolygons.size;
  const deletedCount = deletedPolygons.size;
  const totalUnsaved = newCount + editedCount + deletedCount;
  const hasActiveMode = isDrawing || isEditing || isDeleting;

  return (
    <Paper className="pp-root" square>
      <Typography variant="subtitle2" className="pp-title">
        Polygons
      </Typography>

      {/* Status Alerts */}
      {saveStatus === "saving" && <StatusAlert type="saving" message="Saving..." />}
      {saveStatus === "success" && <StatusAlert type="success" message="Saved!" />}
      {saveStatus === "error" && <StatusAlert type="error" message="Error" />}
      {isDeleting && <StatusAlert type="error" message="Click polygon to delete" />}
      {isEditing && <StatusAlert type="warning" message="Edit Mode: Drag points to move" />}

      {/* Statistics Panel */}
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

      {/* Control Buttons */}
      <Stack direction="row" spacing={0.3} className="pp-buttons">
        <PolygonButton
          mode="draw"
          isActive={isDrawing}
          disabled={hasActiveMode && !isDrawing}
          onClick={() => handleModeToggle("draw")}
        />

        <PolygonButton
          mode="edit"
          isActive={isEditing}
          disabled={hasActiveMode && !isEditing}
          onClick={() => handleModeToggle("edit")}
        />

        <PolygonButton
          mode="save"
          disabled={totalUnsaved === 0 || saveStatus === "saving"}
          count={totalUnsaved}
          onClick={handleSave}
        />

        <PolygonButton
          mode="delete"
          isActive={isDeleting}
          disabled={polygons.length === 0 || (hasActiveMode && !isDeleting)}
          onClick={() => handleModeToggle("delete")}
        />
      </Stack>

      {/* Drawing Instructions */}
      {isDrawing && <StatusAlert type="info" message="Click map to draw polygon" />}
    </Paper>
  );
};

export default PolygonPanel;