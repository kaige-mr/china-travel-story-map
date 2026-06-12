export function isWebGLAvailable(): boolean {
  if (typeof document === "undefined" || typeof navigator === "undefined") {
    return false;
  }

  if (navigator.userAgent.toLowerCase().includes("jsdom")) {
    return false;
  }

  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}
