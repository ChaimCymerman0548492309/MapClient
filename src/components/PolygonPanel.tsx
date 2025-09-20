import { Button, Stack, Typography, Paper, Box, Alert } from "@mui/material";
import type { Polygon } from "../types/polygon.type";
import { serverApi } from "../api/api";
import { useState } from "react";

type Props = {
  isDrawing: boolean;
  setIsDrawing: (val: boolean) => void;
  polygons: Polygon[];
  setPolygons: React.Dispatch<React.SetStateAction<Polygon[]>>;
};

const PolygonPanel = ({ isDrawing, setIsDrawing, polygons, setPolygons }: Props) => {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const handleSave = async () => {
    try {
      setSaveStatus("saving");
      const newPolygons = polygons.filter((p) => p.id.startsWith("local-"));

      if (!newPolygons.length) {
        setSaveStatus("idle");
        return;
      }

      const savedPolygons = await Promise.all(
        newPolygons.map((poly) =>
          serverApi.addPolygon({
            name: poly.name,
            coordinates: poly.coordinates,
          })
        )
      );

      setPolygons((prev) =>
        prev.map((p) => {
          const saved = savedPolygons.find((sp) => sp.name === p.name);
          return saved ? { ...p, id: saved.id } : p;
        })
      );

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error("Error saving polygons:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleDelete = async () => {
    if (!polygons.length) return;
    const lastPoly = polygons[polygons.length - 1];
    try {
      await serverApi.deletePolygon(lastPoly.id);
      setPolygons((prev) => prev.filter((p) => p.id !== lastPoly.id));
    } catch (err) {
      console.error("Error deleting polygon:", err);
    }
  };

  const unsavedCount = polygons.filter(p => p.id.startsWith("local-")).length;

  return (
    <Paper sx={{ p: 1, height: "90%", display: "flex", flexDirection: "column", minHeight: 0 }}>
      <Typography variant="subtitle2" gutterBottom sx={{ color: "primary.main", fontWeight: "bold", fontSize: '0.9rem' }}>
        Polygons
      </Typography>

      {/* סטטוס שמירה */}
      {saveStatus === "saving" && (
        <Alert severity="info" sx={{ mb: 0.5, py: 0.3, fontSize: '0.7rem' }}>
          Saving...
        </Alert>
      )}
      {saveStatus === "success" && (
        <Alert severity="success" sx={{ mb: 0.5, py: 0.3, fontSize: '0.7rem' }}>
          Saved!
        </Alert>
      )}
      {saveStatus === "error" && (
        <Alert severity="error" sx={{ mb: 0.5, py: 0.3, fontSize: '0.7rem' }}>
          Error
        </Alert>
      )}

      {/* סטטיסטיקות */}
      <Box sx={{ mb: 1, p: 0.5, bgcolor: "grey.100", borderRadius: 0.5, fontSize: '0.7rem' }}>
        <Typography variant="caption" display="block" fontSize="inherit">
          Total: {polygons.length}
        </Typography>
        <Typography variant="caption" display="block" fontSize="inherit" color={unsavedCount > 0 ? "warning.main" : "success.main"}>
          Unsaved: {unsavedCount}
        </Typography>
      </Box>

      {/* כפתורים */}
      <Stack direction="row" spacing={0.3} sx={{ mt: "auto" }}>
        <Button
          variant={isDrawing ? "contained" : "outlined"}
          color={isDrawing ? "warning" : "primary"}
          size="small"
          onClick={() => setIsDrawing(!isDrawing)}
          sx={{ 
            flex: 1, 
            py: 0.3, 
            fontSize: '0.65rem',
            minWidth: 'auto',
            minHeight: '28px'
          }}
        >
          {isDrawing ? "Stop" : "Draw"}
        </Button>

        <Button
          variant="contained"
          color="success"
          size="small"
          onClick={handleSave}
          disabled={unsavedCount === 0 || saveStatus === "saving"}
          sx={{ 
            flex: 1, 
            py: 0.3, 
            fontSize: '0.65rem',
            minWidth: 'auto',
            minHeight: '28px'
          }}
        >
          Save
        </Button>

        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={handleDelete}
          disabled={polygons.length === 0}
          sx={{ 
            flex: 1, 
            py: 0.3, 
            fontSize: '0.65rem',
            minWidth: 'auto',
            minHeight: '28px'
          }}
        >
          Delete
        </Button>
      </Stack>

      {/* הוראות */}
      {isDrawing && (
        <Alert severity="info" sx={{ mt: 0.5, py: 0.2, fontSize: '0.6rem' }}>
          Click map to draw polygon
        </Alert>
      )}
    </Paper>
  );
};

export default PolygonPanel;