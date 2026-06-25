# Performance Benchmarks & Storage Metrics

## 1. Map Render Frame Timing
- **Initial SVG Render**: < 45ms for 370 city boundary paths.
- **Viewport Pan & Zoom**: Consistent 60fps on modern mobile and desktop browsers using CSS transforms.

## 2. IndexedDB Read/Write Latency
- **Small Payload (< 50KB)**: ~4ms write latency via `idb-keyval`.
- **Large Payload (5MB Story with Attachments)**: ~32ms using chunked serialization, zero UI frame drops.

## 3. Bundle Footprint
- **Gzip Compressed JS**: ~78KB
- **CSS**: ~12KB
