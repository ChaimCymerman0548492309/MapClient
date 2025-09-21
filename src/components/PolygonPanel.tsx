import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react"; // 👈 הוסף useRef ו-useEffect
import { serverApi } from "../api/api";
import type { Polygon } from "../types/polygon.type";

type Props = {
  isDrawing: boolean;
  setIsDrawing: (val: boolean) => void;
  polygons: Polygon[];
  deletedPolygons: Set<string>;
  setPolygons: React.Dispatch<React.SetStateAction<Polygon[]>>;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  editedPolygons: Set<string>; // 👈 חדש - קבל את רשימת הפוליגונים שעודכנו
  setEditedPolygons: React.Dispatch<React.SetStateAction<Set<string>>>; // 👈 חדש
  isDeleting: boolean;
  setIsDeleting: (val: boolean) => void;
  setDeletedPolygons : React.Dispatch<React.SetStateAction<Set<string>>>;
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
  setDeletedPolygons ,
  isDeleting ,
  setIsDeleting
}: Props) => {
  console.log("🚀 ~ PolygonPanel ~ deletedPolygons:", deletedPolygons)
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "saving" | "success" | "error"
  >("idle");
  const previousPolygonsRef = useRef<Polygon[]>([]); // 👈 שמור עותק להשוואה

 useEffect(() => {
  if (previousPolygonsRef.current.length === 0) {
    previousPolygonsRef.current = polygons;
    return;
  }

  const newEdited = new Set(editedPolygons);

  polygons.forEach((poly) => {
    const prevPoly = previousPolygonsRef.current.find(p => p.id === poly.id);
    if (
      prevPoly &&
      JSON.stringify(poly.coordinates) !== JSON.stringify(prevPoly.coordinates)
    ) {
      newEdited.add(poly.id);
    }
  });

  // שמור רק אם באמת השתנה
  if (newEdited.size !== editedPolygons.size) {
    setEditedPolygons(newEdited);
  }

  previousPolygonsRef.current = polygons;
}, [polygons ,setEditedPolygons , editedPolygons]);

const handleSave = async () => {
  try {
    setSaveStatus("saving");

    // 1. מחיקות
    for (const id of deletedPolygons) {
      if (!id.startsWith("local-")) {
        await serverApi.deletePolygon(id);
      }
    }

    // 2. פוליגונים חדשים / מעודכנים
    const polygonsToSave = polygons.filter(
      (p) => p.id.startsWith("local-") || editedPolygons.has(p.id)
    );

    const savedPolygons = await Promise.all(
      polygonsToSave.map(async (poly) => {
        if (poly.id.startsWith("local-")) {
          return await serverApi.addPolygon({
            name: poly.name,
            coordinates: poly.coordinates,
          });
        } else {
          await serverApi.deletePolygon(poly.id);
          return await serverApi.addPolygon({
            name: poly.name,
            coordinates: poly.coordinates,
          });
        }
      })
    );

    // עדכון state
    setPolygons((prev) =>
      prev.map((p) => {
        const saved = savedPolygons.find((sp) => sp.name === p.name);
        return saved ? { ...p, id: saved.id } : p;
      })
    );

    setEditedPolygons(new Set());
    setDeletedPolygons(new Set()); // 👈 נקה מחיקות אחרי שמירה
    setSaveStatus("success");
    setTimeout(() => setSaveStatus("idle"), 3000);
  } catch (err) {
    console.error("Error saving polygons:", err);
    setSaveStatus("error");
    setTimeout(() => setSaveStatus("idle"), 3000);
  }
};


  // const handleDelete = async () => {
  //   if (!polygons.length) return;
  //   const lastPoly = polygons[polygons.length - 1];
  //   try {
  //     if (!lastPoly.id.startsWith("local-")) {
  //       await serverApi.deletePolygon(lastPoly.id);
  //     }
  //     setPolygons((prev) => prev.filter((p) => p.id !== lastPoly.id));

  //     // הסר מהרשימה אם נמחק
  //     if (editedPolygons.has(lastPoly.id)) {
  //       const newEdited = new Set(editedPolygons);
  //       newEdited.delete(lastPoly.id);
  //       setEditedPolygons(newEdited);
  //     }
  //   } catch (err) {
  //     console.error("Error deleting polygon:", err);
  //   }
  // };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isDrawing) {
      setIsDrawing(false);
    }
  };

  // const unsavedCount = polygons.filter((p) => p.id.startsWith("local-")).length;
  // const totalUnsaved = unsavedCount + editedPolygons.size; // 👈 סך הכל לא שמור
const totalUnsaved =
  polygons.filter((p) => p.id.startsWith("local-")).length +
  editedPolygons.size +
  deletedPolygons.size;

  return (
    <Paper
      sx={{
        p: 1,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        minHeight: 0,
      }}
    >
      <Typography
        variant="subtitle2"
        gutterBottom
        sx={{ color: "primary.main", fontWeight: "bold", fontSize: "0.9rem" }}
      >
        Polygons
      </Typography>

      {/* סטטוס */}
      {saveStatus === "saving" && (
        <Alert severity="info" sx={{ mb: 0.5, py: 0.3, fontSize: "0.7rem" }}>
          Saving...
        </Alert>
      )}
      {saveStatus === "success" && (
        <Alert severity="success" sx={{ mb: 0.5, py: 0.3, fontSize: "0.7rem" }}>
          Saved!
        </Alert>
      )}
      {saveStatus === "error" && (
        <Alert severity="error" sx={{ mb: 0.5, py: 0.3, fontSize: "0.7rem" }}>
          Error
        </Alert>
      )}
      {isDeleting && (
        <Alert severity="error" sx={{ mt: 0.5, py: 0.2, fontSize: "0.6rem" }}>
          Click polygon to delete
        </Alert>
      )}

      {/* מצב עריכה */}
      {isEditing && (
        <Alert severity="warning" sx={{ mb: 0.5, py: 0.3, fontSize: "0.7rem" }}>
          Edit Mode: Drag points to move
        </Alert>
      )}

      {/* סטטיסטיקות */}
      <Box
        sx={{
          mb: 1,
          p: 0.5,
          bgcolor: "grey.100",
          borderRadius: 0.5,
          fontSize: "0.7rem",
        }}
      >
        <Typography variant="caption" display="block" fontSize="inherit">
          Total: {polygons.length}
        </Typography>
        <Typography
          variant="caption"
          display="block"
          fontSize="inherit"
          color={totalUnsaved > 0 ? "warning.main" : "success.main"}
        >
          Unsaved: {totalUnsaved}
        </Typography>
        {editedPolygons.size > 0 && (
          <Typography
            variant="caption"
            display="block"
            fontSize="inherit"
            color="warning.main"
          >
            Edited: {editedPolygons.size}
          </Typography>
        )}
        {isEditing && (
          <Chip
            label="EDIT MODE"
            size="small"
            color="warning"
            sx={{ mt: 0.5, fontSize: "0.6rem", height: "20px" }}
          />
        )}
      </Box>

      {/* כפתורים - שורה ראשונה */}
      <Stack direction="row" spacing={0.3} sx={{ mb: 0.5 }}>
        <Button
          variant={isDrawing ? "contained" : "outlined"}
          color={isDrawing ? "warning" : "primary"}
          size="small"
          onClick={() => setIsDrawing(!isDrawing)}
          disabled={isEditing}
          sx={{
            flex: 1,
            py: 0.3,
            fontSize: "0.65rem",
            minHeight: "28px",
          }}
        >
          {isDrawing ? "Stop" : "Draw"}
        </Button>

        <Button
          variant={isEditing ? "contained" : "outlined"}
          color={isEditing ? "warning" : "primary"}
          size="small"
          onClick={handleEditToggle}
          disabled={isDrawing}
          sx={{
            flex: 1,
            py: 0.3,
            fontSize: "0.65rem",
            minHeight: "28px",
          }}
        >
          {isEditing ? "Stop Edit" : "Edit"}
        </Button>
      </Stack>

      {/* כפתורים - שורה שנייה */}
      <Stack direction="row" spacing={0.3} sx={{ mt: "auto" }}>
        <Button
          variant="contained"
          color="success"
          size="small"
          onClick={handleSave}
          disabled={totalUnsaved === 0 || saveStatus === "saving"}
          sx={{
            flex: 1,
            py: 0.3,
            fontSize: "0.65rem",
            minHeight: "28px",
          }}
        >
          Save ({totalUnsaved})
        </Button>

        <Button
          variant={isDeleting ? "contained" : "outlined"}
          color={isDeleting ? "warning" : "error"}
          size="small"
          onClick={() => {
            setIsDeleting(!isDeleting);
            if (isDrawing) setIsDrawing(false);
            if (isEditing) setIsEditing(false);
          }}
          disabled={polygons.length === 0}
          sx={{
            flex: 1,
            py: 0.3,
            fontSize: "0.65rem",
            minHeight: "28px",
          }}
        >
          {isDeleting ? "Cancel Delete" : "Delete"}
        </Button>
      </Stack>

      {/* הוראות */}
      {isDrawing && (
        <Alert severity="info" sx={{ mt: 0.5, py: 0.2, fontSize: "0.6rem" }}>
          Click map to draw polygon
        </Alert>
      )}
    </Paper>
  );
};

export default PolygonPanel;
