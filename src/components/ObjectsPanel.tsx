import { Alert,Box, Button,  MenuItem, Paper,  Select,Stack,Typography,} from "@mui/material";
import { useState } from "react";
import { serverApi } from "../api/api";
import "../App.css";
import type { MapObject } from "../types/object.type";

type Props = {
  objects: MapObject[];
  setObjects: React.Dispatch<React.SetStateAction<MapObject[]>>;
  isAdding: boolean;
  setIsAdding: (v: boolean) => void;
  objectType: string;
  setObjectType: (v: string) => void;
  isDeletingObjects: boolean;
  setIsDeletingObjects: (v: boolean) => void;
  deletedObjects: Set<string>;
  setDeletedObjects: React.Dispatch<React.SetStateAction<Set<string>>>;
  disabled?: boolean; // 👈 prop יחיד לחסימה
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
  deletedObjects,
  setDeletedObjects,
  disabled = false,
}: Props) => {
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");

  const handleAddToggle = () => {
    if (disabled) return;
    setIsAdding(!isAdding);
    setIsDeletingObjects(false);
  };

  const handleDeleteToggle = () => {
    if (disabled) return;
    setIsDeletingObjects(!isDeletingObjects);
    setIsAdding(false);
  };

  const handleSave = async () => {
    try {
      setSaveStatus("saving");

      await Promise.all(
        [...deletedObjects]
          .filter((id) => !id.startsWith("local-"))
          .map((id) => serverApi.deleteObject(id))
      );

      const newObjs = objects.filter((o) => o.id.startsWith("local-"));
      const saved = await Promise.all(
        newObjs.map((o) =>
          serverApi.addObject({ type: o.type, coordinates: o.coordinates })
        )
      );

      setObjects((prev) => {
        const updated = prev.map((o) => {
          if (o.id.startsWith("local-")) {
            const i = newObjs.findIndex((x) => x.id === o.id);
            return saved[i] ? { ...o, id: saved[i].id } : o;
          }
          return o;
        });
        return Array.from(new Map(updated.map((o) => [o.id, o])).values());
      });

      setDeletedObjects(new Set());
      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  };

  const unsaved = objects.filter((o) => o.id.startsWith("local-")).length;
  const pending = unsaved + deletedObjects.size;

  return (
    <Paper className="op-root" square>
      <Typography variant="subtitle1" className="op-title">
        🎯 Objects
      </Typography>

      {saveStatus === "saving" && <Alert severity="info">Saving…</Alert>}
      {saveStatus === "success" && <Alert severity="success">Saved!</Alert>}
      {saveStatus === "error" && <Alert severity="error">Error</Alert>}

      <Box className="op-stats">
        <Typography variant="caption">📊 Total: {objects.length}</Typography>
        <Typography
          variant="caption"
          color={pending ? "warning.main" : "success.main"}
        >
          💾 Pending: {pending}
        </Typography>
      </Box>

      <Select
        fullWidth
        size="small"
        value={objectType}
        onChange={(e) => setObjectType(e.target.value)}
        disabled={disabled || isDeletingObjects}
      >
        <MenuItem value="Marker">📍 Marker</MenuItem>
        <MenuItem value="Jeep">🚙 Jeep</MenuItem>
        <MenuItem value="Ship">🚢 Ship</MenuItem>
        <MenuItem value="Plane">✈️ Plane</MenuItem>
        <MenuItem value="Tree">🌳 Tree</MenuItem>
        <MenuItem value="Building">🏢 Building</MenuItem>
      </Select>

      <Stack direction="row" spacing={0.5}>
        <Button
          variant={isAdding ? "contained" : "outlined"}
          color={isAdding ? "warning" : "primary"}
          onClick={handleAddToggle}
          disabled={disabled}
        >
          {isAdding ? "Cancel Add" : "Add Mode"}
        </Button>

        <Button
          variant={isDeletingObjects ? "contained" : "outlined"}
          color="error"
          onClick={handleDeleteToggle}
          disabled={disabled || !objects.length}
        >
          {isDeletingObjects ? "Cancel Delete" : "Delete Mode"}
        </Button>

        <Button
          variant="contained"
          color="success"
          onClick={handleSave}
          disabled={disabled || !pending || saveStatus === "saving"}
        >
          {saveStatus === "saving" ? "..." : `Save (${pending})`}
        </Button>
      </Stack>
    </Paper>
  );
};

export default ObjectsPanel;
