import { Paper, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { serverApi } from "../api/api";
import MapView from "../components/MapView";
import type { MapObject, MapObjectApiResponse } from "../types/object.type";
import type { Polygon, PolygonApiResponse } from "../types/polygon.type";
// import ObjectsPanel from "../components/ObjectsPanel";
// import { mapPolygonApiResponseToPolygon } from "../assets/mapper";
import MapDataTable from "../components/MapDataTable";
import ObjectsPanel from "../components/ObjectsPanel";
import PolygonPanel from "../components/PolygonPanel";

const HomePage = () => {
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  const [objects, setObjects] = useState<MapObject[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ---- POLYGONS ----
        // ---- POLYGONS ----
        const polyRes: PolygonApiResponse[] = await serverApi.getPolygons();
        setPolygons(
          polyRes.map((p) => ({
            id: p.id,
            name: p.name,
            coordinates: [
              p.geometry.coordinates.exterior.positions.map((pos) => {
                // pos.values = [lon, lat]
                return [pos.values[0], pos.values[1]];
              }),
            ],
          }))
        );

        // const polyRes: PolygonApiResponse[] = await serverApi.getPolygons();
        // setPolygons(polyRes.map(mapPolygonApiResponseToPolygon));
        // setPolygons(
        //   polyRes.map((p) => ({
        //     id: p.id,
        //     name: p.name,
        //     coordinates: [
        //       p.geometry.coordinates.exterior.positions.map(
        //         (pos) => pos.values
        //       ),
        //     ],
        //   }))
        // );

        // ---- OBJECTS ----
        const objRes: MapObjectApiResponse[] = await serverApi.getObjects();
        setObjects(
          objRes.map((o) => ({
            id: o.id,
            type: o.type,
            coordinates: [
              o.location.coordinates.longitude,
              o.location.coordinates.latitude,
            ],
          }))
        );
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchData();
  }, []);

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        overflow: "hidden",
      }}
    >
      {/* Map - Left Side */}
      <div
        style={{
          flex: "3",
          height: "100%",
          borderRight: "1px solid black",
        }}
      >
        <Paper
          sx={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            borderRadius: 0,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              borderBottom: "1px solid black",
              p: 1,
              backgroundColor: "primary.main",
              color: "white",
            }}
          >
            1 Map
          </Typography>
          <div style={{ flex: 1, width: "100%" }}>
            <MapView
              polygons={polygons}
              objects={objects}
              isDrawing={isDrawing}
              onFinishPolygon={(poly) => {
                setPolygons((prev) => [...prev, poly]);
                setIsDrawing(false); // יציאה ממצב ציור
              }}
            />{" "}
          </div>
        </Paper>
      </div>

      {/* Panels - Right Side */}
      <div
        style={{
          flex: "1",
          minWidth: "300px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Polygon Panel */}
        <Paper
          sx={{
            flex: 1,
            borderBottom: "1px solid black",
            p: 1,
            borderRadius: 0,
          }}
        >
          <PolygonPanel
            isDrawing={isDrawing}
            setIsDrawing={setIsDrawing}
            polygons={polygons}
            setPolygons={setPolygons}
          />
        </Paper>

        {/* Objects Panel */}
        <Paper
          sx={{
            flex: 1,
            borderBottom: "1px solid black",
            p: 1,
            borderRadius: 0,
          }}
        >
          <ObjectsPanel />
        </Paper>

        {/* Map Data Panel */}
        <Paper
          sx={{
            flex: 2,
            p: 1,
            overflow: "auto",
            borderRadius: 0,
          }}
        >
          <Typography variant="h6" sx={{ mb: 1 }}>
            4 Map Data
          </Typography>
          <MapDataTable polygons={polygons} objects={objects} />
        </Paper>
      </div>
    </div>
  );
};

export default HomePage;
