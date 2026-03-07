/**
 * Safe MIME/extension mapping. Section 15.
 */

export const ALLOWED_AUDIO_MIMES = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/wave"
]);

export const ALLOWED_VIDEO_MIMES = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime"
]);

export const ALLOWED_IMAGE_MIMES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp"
]);

export const MIME_TO_EXT: Record<string, string> = {
  "audio/mpeg": "mp3",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/wav": "wav",
  "audio/wave": "wav",
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/quicktime": "mov",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

export type LogicalMediaType = "audio" | "video" | "image";

export function getExtensionFromMime(mime: string): string | null {
  return MIME_TO_EXT[mime?.toLowerCase()] ?? null;
}

export function getLogicalMediaType(mime: string): LogicalMediaType | null {
  const m = (mime || "").toLowerCase();
  if (ALLOWED_AUDIO_MIMES.has(m)) return "audio";
  if (ALLOWED_VIDEO_MIMES.has(m)) return "video";
  if (ALLOWED_IMAGE_MIMES.has(m)) return "image";
  return null;
}
