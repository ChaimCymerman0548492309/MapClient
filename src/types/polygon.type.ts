// הפורמט הנקי שבו נשתמש באפליקציה
export type Polygon = {
  id: string;
  name: string;
  coordinates: number[][][]; // [[[lon, lat], ...]]
};

// הפורמט שחוזר מה-API
export type PolygonApiResponse = {
  id: string;
  name: string;
  geometry: {
    coordinates: {
      exterior: {
        positions: { values: [number, number] }[];
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      holes: any[];
    };
  };
};
