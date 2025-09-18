import { Table, TableBody, TableCell, TableHead, TableRow, Typography } from "@mui/material";
import type { Polygon } from "../types/polygon.type";
import type { MapObject } from "../types/object.type";

const MapDataTable = ({ polygons, objects }: { polygons: Polygon[]; objects: MapObject[] }) => {
  return (
    <div>
      <Typography variant="h6" gutterBottom>
        Map Data
      </Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Type</TableCell>
            <TableCell>Name/ID</TableCell>
            <TableCell>Lat</TableCell>
            <TableCell>Lon</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {/* הצגת אובייקטים */}
          {objects.map((object) => (
            <TableRow key={`object-${object.id}`}>
              <TableCell>{object.type}</TableCell>
              <TableCell>ID: {object.id}</TableCell>
              <TableCell>{object.coordinates[1]?.toFixed(6)}</TableCell>
              <TableCell>{object.coordinates[0]?.toFixed(6)}</TableCell>
            </TableRow>
          ))}
          
          {/* הצגת פוליגונים */}
          {polygons.map((polygon) => (
            <TableRow key={`polygon-${polygon.id}`}>
              <TableCell>Polygon</TableCell>
              <TableCell>{polygon.name || `ID: ${polygon.id}`}</TableCell>
              <TableCell colSpan={2}>
                {polygon.coordinates[0]?.length || 0} points
              </TableCell>
            </TableRow>
          ))}
          
          {/* אם אין נתונים */}
          {objects.length === 0 && polygons.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} align="center">
                No data available
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default MapDataTable;