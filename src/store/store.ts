// src/store/store.ts
import { configureStore } from "@reduxjs/toolkit";
import polygonsReducer from "./slices/polygonsSlice";
import objectsReducer from "./slices/objectsSlice";

export const store = configureStore({
  reducer: {
    polygons: polygonsReducer,
    objects: objectsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;



  // import { useDispatch, useSelector } from "react-redux";
// import { fetchObjects } from "../store/slices/objectsSlice";
// import { fetchPolygons } from "../store/slices/polygonsSlice";
// import type { AppDispatch, RootState } from "../store/store";
//   const polygons2 = useSelector((state: RootState) => state.polygons.list);
//   const objects2 = useSelector((state: RootState) => state.objects.list);

//   const dispatch = useDispatch<AppDispatch>();
// useEffect(() => {
//   // 1️⃣ טען מהשרת רק בפעם הראשונה
//   dispatch(fetchPolygons());
//   dispatch(fetchObjects());
// }, [dispatch]);

// // 2️⃣ האזן לשינויים בנתונים שמגיעים מהשרת בפעם הראשונה בלבד
// useEffect(() => {
//   if (polygons2.length > 0 && polygons.length === 0) {
//     setPolygons(polygons2);
//   }
// }, [polygons2]);

// useEffect(() => {
//   if (objects2.length > 0 && objects.length === 0) {
//     setObjects(objects2);
//   }
// }, [objects2]);
