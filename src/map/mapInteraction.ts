import { MAP_CAMERA } from "./mapScene";

export const MAP_ORBIT_CONTROLS = {
  defaultCameraPosition: [0, 0.86, MAP_CAMERA.z] as const,
  target: [0, -0.14, 0] as const,
  enablePan: false,
  enableZoom: true,
  minDistance: 5.5,
  maxDistance: 8.3,
  minPolarAngle: Math.PI * 0.34,
  maxPolarAngle: Math.PI * 0.54,
  minAzimuthAngle: -Math.PI * 0.34,
  maxAzimuthAngle: Math.PI * 0.34,
  rotateSpeed: 0.55,
  zoomSpeed: 0.48,
  dampingFactor: 0.08
};
