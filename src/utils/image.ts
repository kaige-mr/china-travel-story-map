export interface PreparedImage {
  url: string;
  width: number;
  height: number;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to read image"));
    image.src = url;
  });
}

export async function prepareImageFile(file: File, maxSize = 1600): Promise<PreparedImage> {
  const originalUrl = await readFileAsDataUrl(file);

  try {
    const image = await loadImage(originalUrl);
    const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      return { url: originalUrl, width: image.naturalWidth, height: image.naturalHeight };
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    return {
      url: canvas.toDataURL("image/webp", 0.86),
      width,
      height
    };
  } catch {
    return { url: originalUrl, width: 1200, height: 1500 };
  }
}

export function fileNameToCaption(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Untitled memory";
}
