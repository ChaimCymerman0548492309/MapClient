import {
  Table, TableBody, TableCell, TableHead, TableRow,
  Typography, IconButton, Box, Chip, Tooltip
} from "@mui/material";
import { Delete } from "@mui/icons-material";
import type { Polygon } from "../types/polygon.type";
import type { MapObject } from "../types/object.type";
import { serverApi } from "../api/api";

type Props = {
  polygons: Polygon[];
  objects: MapObject[];
  setPolygons: React.Dispatch<React.SetStateAction<Polygon[]>>;
  setObjects: React.Dispatch<React.SetStateAction<MapObject[]>>;
  setObjectType?: (type: string) => void; // אופציונלי
};

const MapDataTable = ({ polygons, objects, setPolygons, setObjects }: Props) => {

  const truncateText = (text: string, maxLength = 15) =>
    text.length <= maxLength ? text : text.substring(0, maxLength) + "...";

  // ✅ מחיקת אובייקט מהשרת ומהסטייט
  const handleDeleteObject = async (id: string) => {
    try {
      await serverApi.deleteObject(id);
      setObjects((prev) => prev.filter((o) => o.id !== id));
    } catch (err) {
      console.error("Error deleting object:", err);
    }
  };

  // ✅ מחיקת פוליגון מהשרת ומהסטייט
  const handleDeletePolygon = async (id: string) => {
    try {
      await serverApi.deletePolygon(id);
      setPolygons((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Error deleting polygon:", err);
    }
  };

  return (
    <Box sx={{ width: "100%", height: "100%", overflow: "hidden" }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{ color: "primary.main", fontWeight: "bold", fontSize: "1rem" }}
      >
        📊 Map Data
      </Typography>

      <Box sx={{ height: "calc(100% - 40px)", overflow: "auto" }}>
        <Table
          size="small"
          sx={{
            "& .MuiTableCell-root": {
              py: 0.8,
              fontSize: "0.75rem",
              maxWidth: "120px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            },
            tableLayout: "fixed",
          }}
        >
          <TableHead>
            <TableRow sx={{ backgroundColor: "grey.100" }}>
              <TableCell sx={{ fontWeight: "bold", width: "25%" }}>
                Name/ID
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", width: "15%" }}>Lat</TableCell>
              <TableCell sx={{ fontWeight: "bold", width: "15%" }}>Lon</TableCell>
              <TableCell sx={{ fontWeight: "bold", width: "10%" }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {/* אובייקטים */}
            {objects.map((object) => (
              <TableRow
                key={`object-${object.id}`}
                sx={{
                  "&:hover": { backgroundColor: "action.hover" },
                  "&:last-child td": { borderBottom: 0 },
                }}
              >
                <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
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
                      sx={{
                        "&:hover": {
                          backgroundColor: "error.light",
                          color: "white",
                        },
                        transition: "all 0.2s",
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}

            {/* פוליגונים */}
            {polygons.map((polygon) => (
              <TableRow
                key={`polygon-${polygon.id}`}
                sx={{
                  "&:hover": { backgroundColor: "action.hover" },
                  "&:last-child td": { borderBottom: 0 },
                }}
              >
                <TableCell>
                  <Chip
                    label="Polygon"
                    size="small"
                    color="secondary"
                    variant="outlined"
                    sx={{ fontSize: "0.7rem" }}
                  />
                </TableCell>
                <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>
                  <Tooltip title={polygon.name || polygon.id} arrow>
                    <span>{truncateText(polygon.name || polygon.id, 12)}</span>
                  </Tooltip>
                </TableCell>
                <TableCell colSpan={2}>
                  <Chip
                    label={`${polygon.coordinates[0]?.length || 0} pts`}
                    size="small"
                    variant="filled"
                    sx={{ fontSize: "0.65rem", bgcolor: "grey.300" }}
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Delete polygon" arrow>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeletePolygon(polygon.id)}
                      sx={{
                        "&:hover": {
                          backgroundColor: "error.light",
                          color: "white",
                        },
                        transition: "all 0.2s",
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}

            {/* אין נתונים */}
            {objects.length === 0 && polygons.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 2, color: "text.secondary" }}>
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <span style={{ fontSize: "1.5rem" }}>📭</span>
                    <Typography variant="body2" sx={{ mt: 0.5, fontSize: "0.8rem" }}>
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
