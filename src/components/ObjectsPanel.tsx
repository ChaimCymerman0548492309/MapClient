import { useState } from "react";
import { Button, Stack, Typography, Select, MenuItem, Paper, Box, Alert } from "@mui/material";
import type { MapObject } from "../types/object.type";
import { serverApi } from "../api/api";

type Props = {
  objects: MapObject[];
  setObjects: React.Dispatch<React.SetStateAction<MapObject[]>>;
  isAdding: boolean;
  setIsAdding: (val: boolean) => void;
  objectType: string;
  setObjectType: (val: string) => void;
  // 👇 חדשים
  isDeletingObjects: boolean;
  setIsDeletingObjects: (val: boolean) => void;
  deletedObjects: Set<string>;
  setDeletedObjects :  React.Dispatch<React.SetStateAction<Set<string>>>
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
  setDeletedObjects ,
  deletedObjects,
}: Props) => {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const handleAddToggle = () => setIsAdding(!isAdding);
  const handleDeleteModeToggle = () => setIsDeletingObjects(!isDeletingObjects);

const handleSave = async () => {
  try {
    setSaveStatus("saving");

    // 1. מחיקות
    for (const id of deletedObjects) {
      if (!id.startsWith("local-")) {
        await serverApi.deleteObject(id);
      }
    }

    // 2. אובייקטים חדשים
    const objectsToSave = objects.filter((o) => o.id.startsWith("local-"));
    const savedObjects = await Promise.all(
      objectsToSave.map(async (obj) =>
        await serverApi.addObject({
          type: obj.type,
          coordinates: obj.coordinates,
        })
      )
    );

    // עדכון ה־IDs
    setObjects((prev) =>
      prev.map((o) => {
        const saved = savedObjects.find((so) => so.type === o.type);
        return saved ? { ...o, id: saved.id } : o;
      })
    );

    // ✅ נקה גם מחיקות וגם "חדשים לא שמורים"
    setDeletedObjects(new Set());
    setSaveStatus("success");
    setTimeout(() => setSaveStatus("idle"), 3000);
  } catch (err) {
    console.error("Error saving objects:", err);
    setSaveStatus("error");
    setTimeout(() => setSaveStatus("idle"), 3000);
  }
};

  // סטטיסטיקות לשורת מצב
  const unsavedNew = objects.filter((o) => o.id.startsWith("local-")).length;
  const pendingDeletes = deletedObjects.size;
  const totalPending = unsavedNew + pendingDeletes;

  return (
    <Paper
    //  sx={{ p: 1.5, height: "90%", display: "flex", flexDirection: "column" }}
     >
      <Typography variant="subtitle1" gutterBottom sx={{ color: "primary.main", fontWeight: "bold", fontSize: "1rem" }}>
        🎯 Objects
      </Typography>

      {/* סטטוס */}
      {saveStatus === "saving" && <Alert severity="info" sx={{ mb: 1, py: 0.5 }}>Saving…</Alert>}
      {saveStatus === "success" && <Alert severity="success" sx={{ mb: 1, py: 0.5 }}>Saved!</Alert>}
      {saveStatus === "error" && <Alert severity="error" sx={{ mb: 1, py: 0.5 }}>Error</Alert>}

      {/* סטטיסטיקות */}
      <Box sx={{ mb: 1.5, p: 0.8, bgcolor: "grey.100", borderRadius: 1 }}>
        <Typography variant="caption" display="block">📊 Total: {objects.length}</Typography>
        <Typography variant="caption" display="block" color={totalPending ? "warning.main" : "success.main"}>
          💾 Pending: {totalPending} &nbsp;
          <span style={{ color: "#888" }}>
            (new: {unsavedNew}, delete: {pendingDeletes})
          </span>
        </Typography>
        {isDeletingObjects && (
          <Alert severity="warning" sx={{ mt: 1, py: 0.3, fontSize: "0.75rem" }}>
            Delete mode: click icons on the map to remove
          </Alert>
        )}
      </Box>

      {/* בחירת סוג */}
      <Typography variant="caption" display="block" gutterBottom>
        Select Type:
      </Typography>
      <Select
        fullWidth
        size="small"
        value={objectType}
        onChange={(e) => setObjectType(e.target.value)}
        sx={{ mb: 1.5, fontSize: "0.8rem", height: "32px" }}
      >
        <MenuItem value="Marker" sx={{ fontSize: "0.8rem" }}>📍 Marker</MenuItem>
        <MenuItem value="Jeep" sx={{ fontSize: "0.8rem" }}>🚙 Jeep</MenuItem>
        <MenuItem value="Ship" sx={{ fontSize: "0.8rem" }}>🚢 Ship</MenuItem>
        <MenuItem value="Plane" sx={{ fontSize: "0.8rem" }}>✈️ Plane</MenuItem>
        <MenuItem value="Tree" sx={{ fontSize: "0.8rem" }}>🌳 Tree</MenuItem>
        <MenuItem value="Building" sx={{ fontSize: "0.8rem" }}>🏢 Building</MenuItem>
      </Select>

      {/* כפתורים */}
      <Stack direction="row" spacing={0.5} sx={{ mt: "auto" }}>
        <Button
          variant={isAdding ? "contained" : "outlined"}
          color={isAdding ? "warning" : "primary"}
          size="small"
          onClick={handleAddToggle}
          sx={{ flex: 1 }}
        >
          {isAdding ? "🖱 Add on map" : "➕ Add"}
        </Button>

        <Button
          variant={isDeletingObjects ? "contained" : "outlined"}
          color={isDeletingObjects ? "warning" : "error"}
          size="small"
          onClick={handleDeleteModeToggle}
          sx={{ flex: 1 }}
          disabled={!objects.length}
        >
          {isDeletingObjects ? "Cancel" : "🗑 Delete"}
        </Button>

        <Button
          variant="contained"
          color="success"
          size="small"
          onClick={handleSave}
          disabled={totalPending === 0 || saveStatus === "saving"}
          sx={{ flex: 1 }}
        >
          💾 Save ({totalPending})
        </Button>
      </Stack>
    </Paper>
  );
};

export default ObjectsPanel;
