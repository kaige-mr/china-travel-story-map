# System Architecture Overview

## 1. Architecture Stack
- **Frontend Core**: React 18 + TypeScript + Vite
- **Map Visuals**: High-performance SVG / Canvas Map rendering with dynamic viewport transforms.
- **State Store**: Zustand store handling active story edits, route node sequencing, and UI toggles.
- **Storage Tier**: Dual-tier storage mechanism:
  - Primary: IndexedDB (`idb-keyval`) for handling multi-megabyte image assets and state.
  - Fallback: `localStorage` wrapper when IDB is unavailable or quota is exceeded.

## 2. Data Flow
```
[User Input] --> [Zustand Store] --> [Debounced Sync] --> [LocalStoryRepository]
                                                                |
                                             +------------------+------------------+
                                             |                                     |
                                        [IndexedDB]                          [LocalStorage]
```
