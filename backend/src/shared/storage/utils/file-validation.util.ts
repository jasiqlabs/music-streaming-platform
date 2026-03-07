/**
 * File validation before upload. Section 15 & 16.
 * MIME, size, extension; reject dangerous types.
 */

import {
  ALLOWED_AUDIO_MIMES,
  ALLOWED_VIDEO_MIMES,
  ALLOWED_IMAGE_MIMES,
  getLogicalMediaType,
  type LogicalMediaType
} from "./file-metadata.util";

const DANGEROUS_EXT = new Set([
  "exe", "bat", "cmd", "sh", "ps1", "js", "ts", "mjs", "cjs",
  "php", "phtml", "asp", "aspx", "jsp", "jar", "dll", "so"
]);

const MAX_FILENAME_LENGTH = 255;

export interface FileValidationInput {
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  claimedMediaType: "audio" | "video" | "image";
  maxSizeBytes: number;
}

export interface FileValidationResult {
  ok: boolean;
  error?: string;
  extension?: string;
  logicalMediaType?: LogicalMediaType;
}

export function validateFileForUpload(input: FileValidationInput): FileValidationResult {
  const { originalFilename, mimeType, sizeBytes, claimedMediaType, maxSizeBytes } = input;

  if (!originalFilename || typeof originalFilename !== "string") {
    return { ok: false, error: "Missing or invalid filename" };
  }
  if (originalFilename.length > MAX_FILENAME_LENGTH) {
    return { ok: false, error: "Filename too long" };
  }

  const ext = (originalFilename.split(".").pop() || "").toLowerCase();
  if (DANGEROUS_EXT.has(ext)) {
    return { ok: false, error: "File type not allowed" };
  }

  const mime = (mimeType || "").toLowerCase().trim();
  const logical = getLogicalMediaType(mime);
  if (!logical) {
    return { ok: false, error: "Unsupported MIME type" };
  }

  const allowedSet =
    claimedMediaType === "audio"
      ? ALLOWED_AUDIO_MIMES
      : claimedMediaType === "video"
        ? ALLOWED_VIDEO_MIMES
        : ALLOWED_IMAGE_MIMES;
  if (!allowedSet.has(mime)) {
    return { ok: false, error: `MIME type not allowed for ${claimedMediaType}` };
  }

  if (logical !== claimedMediaType) {
    return { ok: false, error: "MIME type does not match claimed media type" };
  }

  const size = Number(sizeBytes);
  if (!Number.isFinite(size) || size < 0) {
    return { ok: false, error: "Invalid file size" };
  }
  if (size > maxSizeBytes) {
    return { ok: false, error: `File size exceeds limit (max ${Math.round(maxSizeBytes / 1024 / 1024)}MB)` };
  }

  const extFromMime = mime === "image/jpeg" ? "jpg" : mime === "audio/mpeg" ? "mp3" : (mime.split("/")[1] || "bin");
  return {
    ok: true,
    extension: extFromMime,
    logicalMediaType: logical
  };
}
