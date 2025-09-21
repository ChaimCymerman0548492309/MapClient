import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    if (previousPolygonsRef.current.length === 0) {
      previousPolygonsRef.current = [...polygons]; // 🔥 עותק עמוק
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

    // שמור רק אם באמת השתנה
    if (newEdited.size !== editedPolygons.size) {
      setEditedPolygons(newEdited);
    }

    previousPolygonsRef.current = [...polygons]; // 🔥 עותק עמוק
  }, [polygons, setEditedPolygons, editedPolygons]);

  const handleSave = async () => {
    try {
      setSaveStatus("saving");

      // 1. מחיקות
      for (const id of deletedPolygons) {
        if (!id.startsWith("local-")) {
          await serverApi.deletePolygon(id);
        }
      }

      // 2. פוליגונים חדשים
      const newPolygons = polygons.filter((p) => p.id.startsWith("local-"));
      const savedNewPolygons = await Promise.all(
        newPolygons.map(async (poly) => 
          await serverApi.addPolygon({
            name: poly.name,
            coordinates: poly.coordinates,
          })
        )
      );

      // 3. פוליגונים מעודכנים (לא חדשים)
      const editedExistingPolygons = polygons.filter(
        (p) => !p.id.startsWith("local-") && editedPolygons.has(p.id)
      );

      const savedEditedPolygons = await Promise.all(
        editedExistingPolygons.map(async (poly) => {
          // מחק את הישן
          await serverApi.deletePolygon(poly.id);
          // צור חדש
          return await serverApi.addPolygon({
            name: poly.name,
            coordinates: poly.coordinates,
          });
        })
      );

      console.log("🚀 ~ handleSave ~ savedNewPolygons:", savedNewPolygons);
      console.log("🚀 ~ handleSave ~ savedEditedPolygons:", savedEditedPolygons);

      // 🔥 עדכון state בצורה נכונה
      setPolygons((prev) => {
        // התחל עם פוליגונים שלא נערכו ולא נמחקו
        const updated = prev.filter(
          (p) => 
            !p.id.startsWith("local-") && 
            !editedPolygons.has(p.id) && 
            !deletedPolygons.has(p.id)
        );

        // הוסף את החדשים עם ID מהשרת
        for (let i = 0; i < newPolygons.length; i++) {
          if (savedNewPolygons[i]) {
            updated.push(savedNewPolygons[i]);
          }
        }

        // הוסף את הנערכים עם ID חדש מהשרת
        for (let i = 0; i < editedExistingPolygons.length; i++) {
          if (savedEditedPolygons[i]) {
            updated.push(savedEditedPolygons[i]);
          }
        }

        return updated;
      });

      // 🔥 נקה את כל הסטטוסים
      setEditedPolygons(new Set());
      setDeletedPolygons(new Set());
      
      // 🔥 עדכן את הרפרנס
      setTimeout(() => {
        previousPolygonsRef.current = [...polygons];
      }, 100);

      setSaveStatus("success");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      console.error("Error saving polygons:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (isDrawing) {
      setIsDrawing(false);
    }
  };

  // 🔥 חישוב נכון של unsaved
  const newPolygonsCount = polygons.filter((p) => p.id.startsWith("local-")).length;
  const editedPolygonsCount = editedPolygons.size;
  const deletedPolygonsCount = deletedPolygons.size;
  const totalUnsaved = newPolygonsCount + editedPolygonsCount + deletedPolygonsCount;

  return (
    <Paper
      sx={{
        p: 1,
        height: "90%",
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
        {newPolygonsCount > 0 && (
          <Typography
            variant="caption"
            display="block"
            fontSize="inherit"
            color="info.main"
          >
            New: {newPolygonsCount}
          </Typography>
        )}
        {editedPolygonsCount > 0 && (
          <Typography
            variant="caption"
            display="block"
            fontSize="inherit"
            color="warning.main"
          >
            Edited: {editedPolygonsCount}
          </Typography>
        )}
        {deletedPolygonsCount > 0 && (
          <Typography
            variant="caption"
            display="block"
            fontSize="inherit"
            color="error.main"
          >
            Deleted: {deletedPolygonsCount}
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
          {isDrawing ? "Stop Draw Mode" : "Draw Mode"}
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
          {isEditing ? "Stop Edit Mode" : "Edit Mode"}
        </Button>
   
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
          {isDeleting ? "Cancel Delete Mode" : "Delete Mode"}
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