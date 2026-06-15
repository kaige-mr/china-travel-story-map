<div align="center">
  <h1>🗺️ China Travel Story Map <br/> (中国旅行记忆地图)</h1>

  <p>
    An interactive 3D map application to log, visualize, and share your travel memories across China. <br/>
    一个具有极客审美的全量3D互动中国旅行记忆地图，支持足迹点亮、照片上传与回忆分享。
  </p>

  <p>
    <a href="https://kaige-mr.github.io/china-travel-story-map">
      <img src="https://img.shields.io/badge/Live%20Demo-Visit%20Site-success?style=for-the-badge&logo=github" alt="Live Demo" />
    </a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/React-19-blue?logo=react" alt="React" />
    <img src="https://img.shields.io/badge/Three.js-0.181-black?logo=three.js" alt="Three.js" />
    <img src="https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite" alt="Vite" />
    <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript" alt="TypeScript" />
  </p>
</div>

---

## 🌟 Overview (简介)

**China Travel Story Map** is a beautifully designed, local-first web application that allows users to record their travel footprints across Chinese provinces. Built with cutting-edge 3D rendering (Three.js), the map provides an immersive experience to bring your travel memories to life. 

**中国旅行记忆地图** 是一个极具设计感的本地优先 (Local-First) Web 应用。借助 Three.js 的 3D 渲染技术，你可以在互动地图上点亮你曾经踏足的省份，上传带有地理位置的照片，并生成专属的旅行回忆分享链接。

---

## ✨ Features (核心特性)

* 🎨 **Interactive 3D Map (全量 3D 互动地图)**
  * Rendered entirely in WebGL with stunning lighting, clearcoat, and shadow effects. (基于 WebGL 渲染，提供极致的光影与悬浮视觉表现)。
* 📸 **Smart Photo EXIF Parsing (智能照片解析)**
  * Upload your photos and the app will automatically extract GPS coordinates from EXIF data to locate which province you visited. (上传照片即可自动读取 EXIF GPS 坐标，精准点亮对应省市)。
* 🔒 **Local-First & Privacy Focused (纯本地安全隐私存储)**
  * Your memories stay yours. Data is stored safely on your device using IndexedDB, avoiding cloud storage limitations or privacy leaks. (所有照片与足迹数据通过 IndexedDB 极速保存在本地设备，拒绝隐私泄露)。
* 🚀 **High Performance Image Optimization (高性能图片压缩)**
  * Automatically converts heavy image uploads into lightweight WebP/JPEG formats in the browser to ensure snappy performance. (浏览器端自动无损压缩转码，降低存储压力)。
* 🔗 **Shareable Memories (回忆分享)**
  * Generate a unique link for your travel map to share with friends and family. (一键生成属于你个人的足迹分享链接)。

---

## 🛠️ Tech Stack (技术栈)

* **Framework:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
* **3D Rendering:** [Three.js](https://threejs.org/) + [@react-three/fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction)
* **Map Data processing:** [TopoJSON](https://github.com/topojson/topojson)
* **State Management:** [Zustand](https://github.com/pmndrs/zustand)
* **Persistence:** [idb-keyval](https://github.com/jakearchibald/idb-keyval)
* **Animations:** [GSAP](https://gsap.com/)
* **Icons:** [Lucide React](https://lucide.dev/)

---

## 🚀 Quick Start (快速开始)

### Prerequisites

Make sure you have [Node.js](https://nodejs.org/) (v18+) installed.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/kaige-mr/china-travel-story-map.git
   cd china-travel-story-map
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

### Building for Production

```bash
npm run build
```

---

## 📜 License

MIT License.
