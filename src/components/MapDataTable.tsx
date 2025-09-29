// MapDataTable.tsx
import { Delete } from "@mui/icons-material";
import {
  Box,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { serverApi } from "../api/api";
import type { MapObject } from "../types/object.type";
import type { Polygon } from "../types/polygon.type";
import "../App.css";

type Props = {
  polygons: Polygon[];
  objects: MapObject[];
  setPolygons: React.Dispatch<React.SetStateAction<Polygon[]>>;
  setObjects: React.Dispatch<React.SetStateAction<MapObject[]>>;
};

const MapDataTable = ({ polygons, objects, setPolygons, setObjects }: Props) => {
  const truncateText = (text: string, maxLength = 15) =>
    text.length <= maxLength ? text : text.substring(0, maxLength) + "...";

  const handleDeleteObject = async (id: string) => {
    try {
      await serverApi.deleteObject(id);
      setObjects((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      console.error("Error deleting object:", err);
    }
  };

  const handleDeletePolygon = async (id: string) => {
    try {
      await serverApi.deletePolygon(id);
      setPolygons((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Error deleting polygon:", err);
    }
  };

  return (
    <Box className="mdt-root">
      <Typography variant="h6" gutterBottom className="mdt-title">
        📊 Map Data
      </Typography>

      <Box className="mdt-container">
        <Table size="small" className="mdt-table">
          <TableHead>
            <TableRow className="mdt-header">
              <TableCell className="mdt-th">Name/ID</TableCell>
              <TableCell className="mdt-th">Lat</TableCell>
              <TableCell className="mdt-th">Lon</TableCell>
              <TableCell className="mdt-th">Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {objects.map((object) => (
              <TableRow key={`object-${object.id}`} className="mdt-row">
                <TableCell className="mdt-mono">
                  <Tooltip title={object.id} arrow>
                    <span>{truncateText(object.id, 12)}</span>
                  </Tooltip>
                </TableCell>
                <TableCell>{object.coordinates[1]?.toFixed(4)}</TableCell>
                <TableCell>{object.coordinates[0]?.toFixed(4)}</TableCell>
                <TableCell>
                  <Tooltip title="Delete object" arrow>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteObject(object.id)}
                      className="mdt-delete-btn"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}

            {polygons.map((polygon, index) => (
              <TableRow key={`polygon-${polygon.id}-${index}`} className="mdt-row">
                <TableCell>
                  <Chip label="Polygon" size="small" color="secondary" variant="outlined" className="mdt-chip" />
                </TableCell>
                <TableCell className="mdt-mono">
                  <Tooltip title={polygon.name || polygon.id} arrow>
                    <span>{truncateText(polygon.name || polygon.id, 12)}</span>
                  </Tooltip>
                </TableCell>
                <TableCell colSpan={2}>
                  <Chip
                    label={`${polygon?.coordinates?.[0]?.length || 0} pts`}
                    size="small"
                    variant="filled"
                    className="mdt-chip-count"
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Delete polygon" arrow>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeletePolygon(polygon.id)}
                      className="mdt-delete-btn"
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}

            {objects.length === 0 && polygons.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" className="mdt-empty">
                  <Box className="mdt-empty-box">
                    <span className="mdt-empty-icon">📭</span>
                    <Typography variant="body2" className="mdt-empty-text">
                      No data available
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
};

export default MapDataTable;
