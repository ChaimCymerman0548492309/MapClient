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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success" | "error">("idle");

  const handleAddToggle = () => {
    if (isAdding) {
      // אם כבר במוד הוספה - כבה
      setIsAdding(false);
    } else {
      // אם לא במוד הוספה - הדלק וכבה מחיקה
      setIsAdding(true);
      setIsDeletingObjects(false);
    }
  };

  const handleDeleteModeToggle = () => {
    if (isDeletingObjects) {
      // אם כבר במוד מחיקה - כבה
      setIsDeletingObjects(false);
    } else {
      // אם לא במוד מחיקה - הדלק וכבה הוספה
      setIsDeletingObjects(true);
      setIsAdding(false);
    }
  };

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

      // נקה גם מחיקות וגם "חדשים לא שמורים"
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
    <Paper sx={{ 
      p: 1.5, 
      display: "flex", 
      flexDirection: "column",
      maxWidth: "100%",
      overflow: "hidden",
      boxSizing: "border-box",
      gap: 1
    }}>
      <Typography variant="subtitle1" sx={{ 
        color: "primary.main", 
        fontWeight: "bold", 
        fontSize: "0.9rem",
        textAlign: "center"
      }}>
        🎯 Objects
      </Typography>

      {/* סטטוס */}
      {saveStatus === "saving" && <Alert severity="info" sx={{ py: 0.5, fontSize: '0.7rem' }}>Saving…</Alert>}
      {saveStatus === "success" && <Alert severity="success" sx={{ py: 0.5, fontSize: '0.7rem' }}>Saved!</Alert>}
      {saveStatus === "error" && <Alert severity="error" sx={{ py: 0.5, fontSize: '0.7rem' }}>Error</Alert>}

      {/* סטטיסטיקות */}
      <Box sx={{ 
        p: 0.8, 
        bgcolor: "grey.100", 
        borderRadius: 1,
        textAlign: "center"
      }}>
        <Typography variant="caption" display="block" fontSize="0.7rem">Total: {objects.length}</Typography>
        <Typography variant="caption" display="block" color={totalPending ? "warning.main" : "success.main"} fontSize="0.7rem">
          Pending: {totalPending}
        </Typography>
        {isDeletingObjects && (
          <Alert severity="warning" sx={{ mt: 0.5, py: 0.2, fontSize: "0.65rem" }}>
            Click icons to remove
          </Alert>
        )}
        {isAdding && (
          <Alert severity="info" sx={{ mt: 0.5, py: 0.2, fontSize: "0.65rem" }}>
            Click map to add
          </Alert>
        )}
      </Box>

      {/* בחירת סוג */}
      <Typography variant="caption" display="block" sx={{ textAlign: "center" }} fontSize="0.7rem">
        Select Type:
      </Typography>
      <Select
        fullWidth
        size="small"
        value={objectType}
        onChange={(e) => setObjectType(e.target.value)}
        sx={{ fontSize: "0.7rem", height: "28px" }}
        disabled={isDeletingObjects} // disable when in delete mode
      >
        <MenuItem value="Marker" sx={{ fontSize: "0.7rem" }}>📍 Marker</MenuItem>
        <MenuItem value="Jeep" sx={{ fontSize: "0.7rem" }}>🚙 Jeep</MenuItem>
        <MenuItem value="Ship" sx={{ fontSize: "0.7rem" }}>🚢 Ship</MenuItem>
        <MenuItem value="Plane" sx={{ fontSize: "0.7rem" }}>✈️ Plane</MenuItem>
        <MenuItem value="Tree" sx={{ fontSize: "0.7rem" }}>🌳 Tree</MenuItem>
        <MenuItem value="Building" sx={{ fontSize: "0.7rem" }}>🏢 Building</MenuItem>
      </Select>

      {/* כפתורים בשורה אחת */}
      <Stack direction="row" spacing={0.5} sx={{ width: "100%" }}>
        <Button
          variant={isAdding ? "contained" : "outlined"}
          color={isAdding ? "warning" : "primary"}
          size="small"
          onClick={handleAddToggle}
          sx={{ 
            fontSize: '0.65rem',
            minWidth: 'auto',
            px: 0.5,
            flex: 1
          }}
          disabled={isDeletingObjects} // disable when in delete mode
        >
          {isAdding ? "Cancel" : "Add"}
        </Button>

        <Button
          variant={isDeletingObjects ? "contained" : "outlined"}
          color={isDeletingObjects ? "error" : "error"}
          size="small"
          onClick={handleDeleteModeToggle}
          sx={{ 
            fontSize: '0.65rem',
            minWidth: 'auto',
            px: 0.5,
            flex: 1
          }}
          disabled={objects.length === 0 || isAdding} // disable when no objects or in add mode
        >
          {isDeletingObjects ? "Cancel" : "Delete"}
        </Button>

        <Button
          variant="contained"
          color="success"
          size="small"
          onClick={handleSave}
          disabled={totalPending === 0 || saveStatus === "saving"}
          sx={{ 
            fontSize: '0.65rem',
            minWidth: 'auto',
            px: 0.5,
            flex: 1
          }}
        >
          {saveStatus === "saving" ? "..." : `Save (${totalPending})`}
        </Button>
      </Stack>
    </Paper>
  );
};

export default ObjectsPanel;