// ObjectsPanel.tsx
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
import "../App.css";
import type { MapObject } from "../types/object.type";

type Props = {
  objects: MapObject[];
  setObjects: React.Dispatch<React.SetStateAction<MapObject[]>>;
  isAdding: boolean;
  setIsAdding: (val: boolean) => void;
  objectType: string;
  setObjectType: (val: string) => void;
  isDeletingObjects: boolean;
  setIsDeletingObjects: (val: boolean) => void;
  deletedObjects: Set<string>;
  setDeletedObjects: React.Dispatch<React.SetStateAction<Set<string>>>;

  
};

const ObjectsPanel = ({
  objects,
  setObjects,
  isAdding,
  setIsAdding,
  objectType,
  setObjectType,
  isDeletingObjects,
  setIsDeletingObjects,
  setDeletedObjects,
  deletedObjects,
}: Props) => {
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");

  const handleAddToggle = () => {
    setIsAdding(!isAdding);
    if (!isAdding) setIsDeletingObjects(false);
  };

  const handleDeleteModeToggle = () => {
    setIsDeletingObjects(!isDeletingObjects);
    if (!isDeletingObjects) setIsAdding(false);
  };

  const handleSave = async () => {
    try {
      setSaveStatus("saving");

      // מחיקות לשרת
      for (const id of deletedObjects) {
        if (!id.startsWith("local-")) {
          await serverApi.deleteObject(id);
        }
      }

      // הוספת חדשים
      const objectsToSave = objects.filter((o) => o.id.startsWith("local-"));
      const savedObjects = await Promise.all(
        objectsToSave.map((obj) =>
          serverApi.addObject({ type: obj.type, coordinates: obj.coordinates })
        )
      );

      // החלפת local- ב־id מהשרת לפי index
      setObjects((prev) => {
        const updated = prev.map((o) => {
          if (o.id.startsWith("local-")) {
            const idx = objectsToSave.findIndex((lo) => lo.id === o.id);
            return savedObjects[idx] ? { ...o, id: savedObjects[idx].id } : o;
          }
          return o;
        });
        // סינון כפולים לפי id
        const unique = new Map(updated.map((o) => [o.id, o]));
        return Array.from(unique.values());
      });

      setDeletedObjects(new Set());
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const unsavedNew = objects.filter((o) => o.id.startsWith("local-")).length;
  const pendingDeletes = deletedObjects.size;
  const totalPending = unsavedNew + pendingDeletes;

  return (
    <Paper className="op-root" square>
      <Typography variant="subtitle1" className="op-title">
        🎯 Objects
      </Typography>

      {saveStatus === "saving" && (
        <Alert severity="info" className="op-alert">
          Saving…
        </Alert>
      )}
      {saveStatus === "success" && (
        <Alert severity="success" className="op-alert">
          Saved!
        </Alert>
      )}
      {saveStatus === "error" && (
        <Alert severity="error" className="op-alert">
          Error
        </Alert>
      )}

      <Box className="op-stats">
        <Typography variant="caption" className="op-stat">
          📊 Total: {objects.length}
        </Typography>
        <Typography
          variant="caption"
          color={totalPending ? "warning.main" : "success.main"}
          className="op-stat"
        >
          💾 Pending: {totalPending}
        </Typography>
        {isDeletingObjects && (
          <Typography
            variant="caption"
            color="warning.main"
            className="op-stat"
          >
            🗑 Click to remove
          </Typography>
        )}
        {isAdding && (
          <Typography variant="caption" color="info.main" className="op-stat">
            ➕ Click map to add
          </Typography>
        )}
      </Box>

      <Select
        fullWidth
        size="small"
        value={objectType}
        onChange={(e) => setObjectType(e.target.value)}
        disabled={isDeletingObjects}
        className="op-select"
      >
        <MenuItem value="Marker" className="op-option">
          📍 Marker
        </MenuItem>
        <MenuItem value="Jeep" className="op-option">
          🚙 Jeep
        </MenuItem>
        <MenuItem value="Ship" className="op-option">
          🚢 Ship
        </MenuItem>
        <MenuItem value="Plane" className="op-option">
          ✈️ Plane
        </MenuItem>
        <MenuItem value="Tree" className="op-option">
          🌳 Tree
        </MenuItem>
        <MenuItem value="Building" className="op-option">
          🏢 Building
        </MenuItem>
      </Select>

      <Stack direction="row" spacing={0.5} className="op-buttons">
        <Button
          variant={isAdding ? "contained" : "outlined"}
          color={isAdding ? "warning" : "primary"}
          size="small"
          onClick={handleAddToggle}
          disabled={isDeletingObjects}
          className="op-btn"
        >
          {isAdding ? "Cancel Add Mode" : "Add Mode"}
        </Button>

        <Button
          variant={isDeletingObjects ? "contained" : "outlined"}
          color="error"
          size="small"
          onClick={handleDeleteModeToggle}
          disabled={objects.length === 0 || isAdding}
          className="op-btn"
        >
          {isDeletingObjects ? "Cancel Delete Mode" : "Delete Mode"}
        </Button>

        <Button
          variant="contained"
          color="success"
          size="small"
          onClick={handleSave}
          disabled={totalPending === 0 || saveStatus === "saving"}
          className="op-btn"
        >
          {saveStatus === "saving" ? "..." : `Save (${totalPending})`}
        </Button>
      </Stack>
    </Paper>
  );
};

export default ObjectsPanel;
