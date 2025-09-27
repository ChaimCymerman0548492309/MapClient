
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
git clone https://github.com/your-username/map-client.git
cd map-client
npm install
````

---

## ▶️ Running

Start the development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
npm run preview
```

---

## ⚙️ Environment

Create a `.env` file with:

```
VITE_API_URL=http://localhost:4000
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

## 🛠 Features

* Polygon drawing with closing detection
* Marker placement with custom icons
* Edit mode (drag vertices)
* Delete mode (click to remove)
* Save pending changes in one click

---


