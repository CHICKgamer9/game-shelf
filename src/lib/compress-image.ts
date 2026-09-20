export const PHOTO_MAX_DIMENSION = 1200;
export const PHOTO_MAX_PER_ITEM = 8;
export const PHOTO_JPEG_QUALITY = 0.82;

export interface CompressedPhoto {
  blob: Blob;
  mimeType: string;
  width: number;
  height: number;
}

function supportsWebp(): boolean {
  if (typeof document === "undefined") return false;
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL("image/webp").startsWith("data:image/webp");
}

async function blobFromCanvas(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((result) => resolve(result), mimeType, quality);
  });
  if (blob && blob.size > 0) return blob;
  const dataUrl = canvas.toDataURL(mimeType, quality);
  const res = await fetch(dataUrl);
  return res.blob();
}

function drawToCanvas(
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
): { canvas: HTMLCanvasElement; width: number; height: number } {
  const scale = Math.min(
    1,
    PHOTO_MAX_DIMENSION / Math.max(sourceWidth, sourceHeight),
  );
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not compress this photo.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(source, 0, 0, width, height);
  return { canvas, width, height };
}

async function loadViaImageElement(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.decoding = "async";
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Could not read that photo."));
      image.src = url;
    });
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function loadBitmap(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      try {
        return await createImageBitmap(file);
      } catch {
        // Fall through to <img> decode (HEIC / odd types on some phones).
      }
    }
  }
  return loadViaImageElement(file);
}

export async function compressImageFile(file: File): Promise<CompressedPhoto> {
  if (file.type && !file.type.startsWith("image/")) {
    throw new Error("Pick a photo (JPEG, PNG, WebP, or HEIC).");
  }

  const source = await loadBitmap(file);
  const sourceWidth =
    "naturalWidth" in source ? source.naturalWidth || source.width : source.width;
  const sourceHeight =
    "naturalHeight" in source
      ? source.naturalHeight || source.height
      : source.height;

  if (!sourceWidth || !sourceHeight) {
    throw new Error("Could not read that photo.");
  }

  const { canvas, width, height } = drawToCanvas(source, sourceWidth, sourceHeight);
  if ("close" in source && typeof source.close === "function") {
    source.close();
  }

  const mimeType = supportsWebp() ? "image/webp" : "image/jpeg";
  const blob = await blobFromCanvas(canvas, mimeType, PHOTO_JPEG_QUALITY);
  return { blob, mimeType, width, height };
}
