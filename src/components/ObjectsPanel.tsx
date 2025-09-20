import {
  Alert,
  Box,
  Button,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { serverApi } from "../api/api";
import type { MapObject } from "../types/object.type";

type Props = {
  objects: MapObject[];
  setObjects: React.Dispatch<React.SetStateAction<MapObject[]>>;
  isAdding: boolean;
  setIsAdding: (val: boolean) => void;
  objectType: string;
  setObjectType: (val: string) => void;
};

const ObjectsPanel = ({
  objects,
  setObjects,
  isAdding,
  setIsAdding,
  objectType,
  setObjectType,
}: Props) => {
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");

  const handleAdd = () => {
    setIsAdding(!isAdding);
  };

  const handleSave = async () => {
    const newObjects = objects.filter((o) => o.id.startsWith("local-"));
    if (!newObjects.length) {
      setSaveStatus("idle");
      return;
    }

    try {
      setSaveStatus("saving");
      const saved = await Promise.all(
        newObjects.map((obj) =>
          serverApi.addObject({
            type: obj.type,
            coordinates: obj.coordinates,
          })
        )
      );

      setObjects((prev) =>
        prev.map((o) => {
          const match = saved.find(
            (s) =>
              s.type === o.type &&
              s.location?.coordinates?.longitude === o.coordinates[0] &&
              s.location?.coordinates?.latitude === o.coordinates[1]
          );
          return match ? { ...o, id: match.id } : o;
        })
      );

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error("Error saving objects:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleDelete = async () => {
    if (!objects.length) return;
    const last = objects[objects.length - 1];
    try {
      if (!last.id.startsWith("local-")) {
        await serverApi.deleteObject(last.id);
      }
      setObjects((prev) => prev.filter((o) => o.id !== last.id));
    } catch (err) {
      console.error("Error deleting object:", err);
    }
  };

  const unsavedCount = objects.filter((o) => o.id.startsWith("local-")).length;

  return (
    <Paper
      sx={{ 
        p: 1.5, 
        height: "100%", 
        display: "flex", 
        flexDirection: "column",
        minHeight: 0
      }}
    >
      <Typography
        variant="subtitle1"
        gutterBottom
        sx={{ color: "primary.main", fontWeight: "bold", fontSize: '1rem' }}
      >
        🎯 Objects
      </Typography>

      {/* סטטוס שמירה */}
      {saveStatus === "saving" && (
        <Alert severity="info" sx={{ mb: 1, py: 0.5 }}>
          Saving...
        </Alert>
      )}
      {saveStatus === "success" && (
        <Alert severity="success" sx={{ mb: 1, py: 0.5 }}>
          Saved!
        </Alert>
      )}
      {saveStatus === "error" && (
        <Alert severity="error" sx={{ mb: 1, py: 0.5 }}>
          Error
        </Alert>
      )}

      {/* סטטיסטיקות */}
      <Box sx={{ mb: 1.5, p: 0.8, bgcolor: "grey.100", borderRadius: 1 }}>
        <Typography variant="caption" display="block">
          📊 Total: {objects.length}
        </Typography>
        <Typography
          variant="caption"
          display="block"
          color={unsavedCount > 0 ? "warning.main" : "success.main"}
        >
          💾 Unsaved: {unsavedCount}
        </Typography>
      </Box>

      {/* בחירת סוג אובייקט */}
      <Typography variant="caption" display="block" gutterBottom>
        Select Type:
      </Typography>
    <Select
  fullWidth
  size="small"
  value={objectType}
  onChange={(e) => setObjectType(e.target.value)}   // 👈 חייב לעדכן את ה־state
  sx={{ mb: 1.5, fontSize: '0.8rem', height: '32px' }}
>
  <MenuItem value="Marker">📍 Marker</MenuItem>
  <MenuItem value="Jeep">🚙 Jeep</MenuItem>
  <MenuItem value="Ship">🚢 Ship</MenuItem>
  <MenuItem value="Plane">✈️ Plane</MenuItem>
  <MenuItem value="Tree">🌳 Tree</MenuItem>
  <MenuItem value="Building">🏢 Building</MenuItem>
</Select>


      {/* כפתורים בשורה אחת */}
      <Stack direction="row" spacing={0.5} sx={{ mt: "auto" }}>
        <Button
          variant={isAdding ? "contained" : "outlined"}
          color={isAdding ? "warning" : "primary"}
          size="small"
          onClick={handleAdd}
          sx={{ 
            flex: 1, 
            py: 0.5, 
            fontSize: '0.7rem',
            minWidth: 'auto'
          }}
        >
          {isAdding ? "🖱️" : "➕"}
        </Button>

        <Button
          variant="contained"
          color="success"
          size="small"
          onClick={handleSave}
          disabled={unsavedCount === 0 || saveStatus === "saving"}
          sx={{ 
            flex: 1, 
            py: 0.5, 
            fontSize: '0.7rem',
            minWidth: 'auto'
          }}
        >
          💾
        </Button>

        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={handleDelete}
          disabled={objects.length === 0}
          sx={{ 
            flex: 1, 
            py: 0.5, 
            fontSize: '0.7rem',
            minWidth: 'auto'
          }}
        >
          🗑️
        </Button>
      </Stack>

      {/* הוראות */}
      {isAdding && (
        <Alert severity="info" sx={{ mt: 1, py: 0.5, fontSize: '0.7rem' }}>
          Click map for {objectType.toLowerCase()}
        </Alert>
      )}
    </Paper>
  );
};

export default ObjectsPanel;