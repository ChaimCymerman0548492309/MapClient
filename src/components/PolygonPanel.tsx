import { Box, Chip, Paper, Stack, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { serverApi } from "../api/api";
import "../App.css";
import type { Polygon } from "../types/polygon.type";
import { PolygonButton, StatusAlert } from "../style/PolygonButton";

type Props = {
  polygons: Polygon[];
  deletedPolygons: Set<string>;
  editedPolygons: Set<string>;
  isDrawing: boolean;
  isEditing: boolean;
  isDeleting: boolean;
  setPolygons: React.Dispatch<React.SetStateAction<Polygon[]>>;
  setIsDrawing: (v: boolean) => void;
  setIsEditing: (v: boolean) => void;
  setIsDeleting: (v: boolean) => void;
  setEditedPolygons: React.Dispatch<React.SetStateAction<Set<string>>>;
  setDeletedPolygons: React.Dispatch<React.SetStateAction<Set<string>>>;
  disabled?: boolean; // 👈 prop יחיד לחסימה
};

const PolygonPanel = ({
  polygons,
  deletedPolygons,
  editedPolygons,
  isDrawing,
  isEditing,
  isDeleting,
  setPolygons,
  setIsDrawing,
  setIsEditing,
  setIsDeleting,
  setEditedPolygons,
  setDeletedPolygons,
  disabled = false,
}: Props) => {
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const prevPolygons = useRef<Polygon[]>([]);

  useEffect(() => {
    if (!prevPolygons.current.length) {
      prevPolygons.current = polygons;
      return;
    }
    const newEdited = new Set(editedPolygons);
    polygons.forEach((poly) => {
      const prev = prevPolygons.current.find((p) => p.id === poly.id);
      if (
        prev &&
        JSON.stringify(poly.coordinates) !== JSON.stringify(prev.coordinates)
      ) {
        newEdited.add(poly.id);
      }
    });
    if (newEdited.size !== editedPolygons.size) setEditedPolygons(newEdited);
    prevPolygons.current = polygons;
  }, [polygons, editedPolygons, setEditedPolygons]);

  const handleSave = async () => {
    try {
      setSaveStatus("saving");

      await Promise.all(
        [...deletedPolygons]
          .filter((id) => !id.startsWith("local-"))
          .map((id) => serverApi.deletePolygon(id))
      );

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

      const edited = await Promise.all(
        polygons
          .filter((p) => editedPolygons.has(p.id) && !p.id.startsWith("local-"))
          .map(async (p) => {
            await serverApi.deletePolygon(p.id);
            const res = await serverApi.addPolygon({
              name: p.name,
              coordinates: p.coordinates,
            });
            return { ...p, id: res.id };
          })
      );

      setPolygons((prev) => [
        ...prev.filter(
          (p) =>
            !p.id.startsWith("local-") &&
            !editedPolygons.has(p.id) &&
            !deletedPolygons.has(p.id)
        ),
        ...newPolys,
        ...edited,
      ]);

      setEditedPolygons(new Set());
      setDeletedPolygons(new Set());
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  const toggle = (mode: "draw" | "edit" | "delete") => {
    if (disabled) return;
    setIsDrawing(mode === "draw" && !isDrawing);
    setIsEditing(mode === "edit" && !isEditing);
    setIsDeleting(mode === "delete" && !isDeleting);
  };

  const newCount = polygons.filter((p) => p.id.startsWith("local-")).length;
  const totalUnsaved =
    newCount + editedPolygons.size + deletedPolygons.size;

  return (
    <Paper className="pp-root" square>
      <Typography variant="subtitle2" className="pp-title">
        Polygons
      </Typography>

      {saveStatus === "saving" && (
        <StatusAlert type="saving" message="Saving..." />
      )}
      {saveStatus === "success" && (
        <StatusAlert type="success" message="Saved!" />
      )}
      {saveStatus === "error" && (
        <StatusAlert type="error" message="Error saving" />
      )}

      <Box className="pp-stats">
        <Typography variant="caption">Total: {polygons.length}</Typography>
        <Typography
          variant="caption"
          color={totalUnsaved ? "warning.main" : "success.main"}
        >
          Unsaved: {totalUnsaved}
        </Typography>
        {isEditing && (
          <Chip label="EDIT MODE" color="warning" size="small" />
        )}
      </Box>

      <Stack direction="row" spacing={0.3}>
        <PolygonButton
          mode="draw"
          isActive={isDrawing}
          disabled={disabled}
          onClick={() => toggle("draw")}
        />
        <PolygonButton
          mode="edit"
          isActive={isEditing}
          disabled={disabled}
          onClick={() => toggle("edit")}
        />
        <PolygonButton
          mode="save"
          disabled={disabled || totalUnsaved === 0}
          count={totalUnsaved}
          onClick={handleSave}
        />
        <PolygonButton
          mode="delete"
          isActive={isDeleting}
          disabled={disabled}
          onClick={() => toggle("delete")}
        />
      </Stack>
    </Paper>
  );
};

export default PolygonPanel;
