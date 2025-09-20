import { Button, Stack, Typography } from "@mui/material";
import type { Polygon } from "../types/polygon.type";
import { serverApi } from "../api/api";

type Props = {
  isDrawing: boolean;
  setIsDrawing: (val: boolean) => void;
  polygons: Polygon[];
  setPolygons: React.Dispatch<React.SetStateAction<Polygon[]>>;
};

const PolygonPanel = ({ isDrawing, setIsDrawing, polygons, setPolygons }: Props) => {
  // console.log("Saving polygons:", polygons);
 const handleSave = async () => {
  // console.log("Saving polygons:", polygons);

  try {
    const newPolygons = polygons.filter((p) => p.id.startsWith("local-")); // 👈 מזהה זמני אמיתי

    if (!newPolygons.length) {
      console.log("אין פוליגונים חדשים לשמירה");
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

    console.log("Polygons saved:", savedPolygons);
  } catch (err) {
    console.error("Error saving polygons:", err);
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

  return (
    <div>
      <Typography variant="h6" gutterBottom>
        2 Polygon
      </Typography>
      <Stack direction="row" spacing={2} sx={{ mt: 1, flexWrap: "wrap" }}>
        <Button
          variant={!isDrawing ? "contained" : "outlined"}
          size="small"
          onClick={() => setIsDrawing(!isDrawing)}
          color={!isDrawing ? "primary" : "inherit"}
        >
          {isDrawing ? "Stop Drawing" : "Start Drawing"}
        </Button>

        <Button variant="contained" color="success" size="small" onClick={handleSave}>
          Save
        </Button>

        <Button variant="outlined" color="error" size="small" onClick={handleDelete}>
          Delete
        </Button>
      </Stack>
    </div>
  );
};

export default PolygonPanel;
