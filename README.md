# China Travel Story Map (中国旅行足迹故事地图) 🗺️

A responsive, high-performance web interactive geographic storytelling platform to record, visualize, optimize, and share travel journeys across China. Built with modern TypeScript, React, HTML5 Canvas 2D / WebGL, and offline-first IndexedDB architecture.

---

## 🌟 Key Capabilities & Features

- **Comprehensive Geographic Coverage**: Includes a curated dataset of over 370 prefecture-level cities across all 34 provincial administrative regions of China, complete with accurate WGS-84 coordinates and pinyin fuzzy search.
- **Multi-Device Responsive Design**: Fluid layout adapts seamlessly between desktop wide-screen monitors, mobile portrait handhelds, and mobile landscape panorama views with dynamic viewport scaling.
- **Spatial Geometry & Indexing Engine**:
  - **QuadTree 2D Index**: Fast spatial subdivision for dense waypoint clustering, range queries, and k-Nearest Neighbor (k-NN) lookups.
  - **Dynamic Marker Clustering**: Zoom-level dependent grid clustering with center-of-mass weighted centroids.
  - **Convex Hull & Delaunay Mesh**: Graham scan algorithm for territory boundary calculation, Shoelace polygon area measurement, and Bowyer-Watson Delaunay triangulation for regional connectivity graphs.
- **Route Optimization & Trajectory Interpolation**:
  - **TSP Tour Optimizer**: 2-Opt local search and Simulated Annealing heuristics to find optimal travel routes minimizing total itinerary distance.
  - **Catmull-Rom Spline**: Centripetal spline generator rendering smooth travel curves with simulated 3D high-altitude flight arcs.
  - **Vincenty Geodesics**: High-precision ellipsoidal geodesic distance, forward/reverse azimuths, and cross-track corridor calculations.
- **Standard GIS Format Interoperability**:
  - **GPX 1.1 Support**: Full export and import of GPS Exchange Format XML tracks and waypoints.
  - **Google Earth KML 2.2**: Generates styled 3D Placemarks, LineStrings, and flight paths.
  - **RFC 7946 GeoJSON**: FeatureCollection generator with validated coordinate topologies and bounding boxes.
- **Offline First & PWA Ready**:
  - **Persistent Storage**: IndexedDB storage layer powered by `idb-keyval` with automatic fallback to `localStorage`.
  - **Service Worker Caching**: Cache-first strategy for static assets and map vector data.
  - **Web App Manifest**: Home-screen installable standalone PWA experience.

---

## 📋 Prerequisites & Requirements

- **Node.js**: Version 18.0.0 or higher (LTS recommended)
- **Package Manager**: npm 9.0.0+ or pnpm 8.0.0+
- **Browser Compatibility**: Modern Evergreen browsers with Canvas 2D and IndexedDB support (Chrome 90+, Safari 15+, Firefox 90+, Edge 90+)

---

## 🚀 Quick Start & Step-by-Step Usage Path

Follow this end-to-end path to set up, run, and utilize the China Travel Story Map application:

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/kaige-mr/china-travel-story-map.git

# Enter the project directory
cd china-travel-story-map

# Install dependencies
npm install
```

### Step 2: Configure Environment

Copy the example configuration file and adjust settings as needed:

```bash
# Create local environment config
cp .env.example .env
```

Configuration variables supported in `.env`:
- `VITE_APP_TITLE`: Application browser title (default: `China Travel Story Map`)
- `VITE_MAP_DEFAULT_CENTER`: Default map center coordinates `[104.1954, 35.8617]`
- `VITE_STORAGE_PREFIX`: Namespace key prefix for IndexedDB records (default: `cts_v1`)
- `VITE_OFFLINE_CACHE_NAME`: Cache storage version identifier for Service Worker

### Step 3: Run the Development Server

```bash
npm run dev
```

Open your browser and navigate to `http://localhost:5173`.

### Step 4: Building Your Travel Story

1. **Add Destinations**: Click on any province or city directly on the interactive China canvas, or use the cascading city selector dropdown to add visited travel stops.
2. **Reorder & Optimize**: Rearrange stops manually or click the **TSP Route Optimizer** button to compute the most fuel/time-efficient travel sequence.
3. **Playback Itinerary**: Click the **Play** button on the bottom timeline bar to trigger animated Bézier curve routes, city pulse rings, and synchronized story card popups.
4. **Export Your Story**:
   - Click **Export GPX** to download GPS tracks for handheld Garmin or outdoor navigation devices.
   - Click **Export KML** to visualize your journey in Google Earth 3D.
   - Click **Export SVG** to save a high-resolution, vector-printable route map.
   - Click **Share Card** to render a customized canvas postcard with travel summary metrics and QR code.

---

## ⚙️ Configuration & Customization Options

The application architecture allows modular configuration via `src/config.ts` and `vite.config.ts`:

### 1. Storage & Persistence Configuration
- By default, `LocalStoryRepository` utilizes `idb-keyval` to bypass browser 5MB quotas for storing user travel photos.
- To adjust the maximum cache quota or fallback thresholds, configure `MAX_IMAGE_BLOB_SIZE_MB = 10` in `src/domain/story.ts`.

### 2. Map Styling & Projection
- Projections: Configurable in `src/map/projection.ts` supporting Equirectangular, Web Mercator, and Albers Equal-Area Conic projections.
- Colors and Themes: Customize province boundary strokes, water fills, and highlighted route gradients in `src/map/mapStyle.ts`.

### 3. Particle & Animation Controls
- Configure emitter density and particle lifetime in `src/engine/animation/ParticleSystem.ts` for lower-spec mobile devices.

---

## 🧪 Testing & Quality Assurance

The codebase includes an exhaustive test suite using **Vitest** and **Testing Library**:

```bash
# Execute the full automated test suite
npm test

# Run tests in watch mode during development
npm run test:watch

# Build production bundle with typecheck
npm run build
```

The test matrix covers:
- `src/domain/spatial/__tests__/`: QuadTree indexing, marker clustering, Graham scan convex hull, Delaunay triangulation.
- `src/domain/routing/__tests__/`: TSP 2-Opt and Simulated Annealing, Catmull-Rom spline, Vincenty geodesics.
- `src/domain/io/__tests__/`: GPX, KML, and GeoJSON serialization/parsing roundtrips.
- `src/engine/animation/__tests__/`: Keyframe tweening engine, easing curve mathematics, particle pooling.

---

## 📁 Project Directory Structure

```
china-travel-story-map/
├── src/
│   ├── components/         # React UI components (Canvas, Viewer, Editor, Lightbox)
│   ├── domain/             # Core business models & algorithmic engines
│   │   ├── spatial/        # QuadTree, MarkerClusterer, ConvexHull, Delaunay
│   │   ├── routing/        # TspOptimizer, SplineInterpolator, Geodesic
│   │   ├── io/             # GpxHandler, KmlHandler, GeoJsonTransformer
│   │   └── cities.ts       # Curated 370-city geographic dataset
│   ├── engine/
│   │   └── animation/      # TweenEngine, ParticleSystem, TimelineDirector
│   ├── map/                # Projection math, China GeoJSON vectors, map styles
│   ├── store/              # Zustand state management store
│   └── utils/              # Color, image compression, debounce helpers
├── docs/                   # Architecture diagrams & performance reports
├── public/                 # Static vector assets & PWA manifest
└── tests/                  # Integration and system tests
```

---

## 📄 License & Attribution

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
Geo-spatial vector data adapted from Open Data sources under public domain guidelines.
