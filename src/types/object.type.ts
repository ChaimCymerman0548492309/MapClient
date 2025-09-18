export type MapObject = {
  id: string;
  type: string;
  coordinates: [number, number]; // [lon, lat]
};

// טיפוס שמתאר איך השרת מחזיר (DTO מה־API)
export type MapObjectApiResponse = {
  id: string;
  type: string;
  location: {
    coordinates: {
      longitude: number;
      latitude: number;
    };
  };
};
