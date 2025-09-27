
````markdown
# Map Client

This is the front-end client for the Map Management project.  
It provides an interactive map where users can:

- Draw polygons
- Add and remove objects (markers)
- Edit existing polygons
- Save changes to the server

---

## 🚀 Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/ChaimCymerman0548492309/MapClient
cd mapClient
npm install
````

---

## ▶️ Running

Start the development :

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

---

## ⚙️ Environment

Create a `.env` file with:

```
VITE_API_URL=http://localhost:5194/api
```

---

## 📂 Project Structure

```
src/
 ├─ api/         # Axios setup
 ├─ components/  # UI components
 ├─ pages/       # Page-level components
 ├─ types/       # Shared TypeScript types
 ├─ App.tsx
 └─ main.tsx
```

---

## 📐 Schemas (Types)

### Polygon

```ts
type Polygon = {
  id: string;
  name: string;
  coordinates: number[][][];
};
```

### MapObject

```ts
type MapObject = {
  id: string;
  type: string;
  coordinates: [number, number];
};
```

---

## 🌐 Routes (API)

The client communicates with the server through REST endpoints:

* **POST /polygons** → add polygon
* **DELETE /polygons/:id** → delete polygon
* **POST /objects** → add object
* **DELETE /objects/:id** → delete object

---

## ✅ Implemented Features

* Map is displayed and polygons can be drawn
* Polygon management (Add / Save / Delete) works as expected
* Objects can be added as markers or custom symbols (e.g., Jeep)
* Map Data Table updates correctly with Object / Lat / Lon
* Data is stored and retrieved from MongoDB via RESTful API
* Code is clean, documented, and modular

---

## 🎁 Bonus Features

* Edit existing polygons
* Choose symbols from a library (Jeep, Ship, Plane, etc.)
* Spatial queries for polygons/objects
* Import/export as GeoJSON
* Unit and integration tests

---

