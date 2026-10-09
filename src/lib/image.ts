/**
 * Pixel bounds for an uploaded logo.
 *
 * The API enforces these itself before it stores anything — these constants
 * exist so the picker can say *why* immediately instead of making the user
 * wait for a rejection they cannot act on. The two repos are deployed
 * separately, so this mirrors `apps/api/src/lib/image.ts`; if one moves, move
 * the other.
 */
export const MIN_LOGO_EDGE = 16;
export const MAX_LOGO_EDGE = 8192;

export interface ImageSize {
  width: number;
  height: number;
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read the file"));
    reader.readAsDataURL(file);
  });
}

/**
 * The file's pixel dimensions, or `null` when they cannot be established.
 *
 * `null` deliberately means "let the server decide" rather than "reject": an
 * SVG sized by a percentage reports 0×0 here while still being perfectly valid,
 * and the API falls back to its viewBox in that case. Only a definite reading
 * is worth failing on locally.
 */
export async function readImageSize(file: File): Promise<ImageSize | null> {
  try {
    const dataUrl = await readFileAsDataUrl(file);
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Not a valid image"));
      element.src = dataUrl;
    });
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height) return null;
    return { width, height };
  } catch {
    return null;
  }
}

/**
 * The problem with a candidate logo's pixel size, or `null` when it is fine.
 *
 * Deliberately pure: the API enforces the same rule server-side, so all this
 * has to do is explain a rejection before the round trip. `null` size means
 * "we could not read it" — an SVG with no intrinsic size is legitimate, and in
 * that case it is the server's verdict that counts, not ours.
 */
export function logoSizeError(size: ImageSize | null): string | null {
  if (!size) return null;
  if (Math.min(size.width, size.height) < MIN_LOGO_EDGE) {
    return `Logo must be at least ${MIN_LOGO_EDGE}×${MIN_LOGO_EDGE} pixels.`;
  }
  if (Math.max(size.width, size.height) > MAX_LOGO_EDGE) {
    return `Logo must be no larger than ${MAX_LOGO_EDGE}×${MAX_LOGO_EDGE} pixels.`;
  }
  return null;
}

/** Read an image file and downscale it (keeps localStorage payloads small). */
export async function readImageAsDataUrl(
  file: File,
  maxSize = 320,
): Promise<string> {
  const dataUrl = await readFileAsDataUrl(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Not a valid image"));
      element.src = dataUrl;
    });

    const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return dataUrl;
    context.drawImage(image, 0, 0, width, height);
    return canvas.toDataURL("image/png");
  } catch {
    return dataUrl;
  }
}
