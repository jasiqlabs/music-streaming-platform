import path from "path";

/**
 * Prevent path traversal. Resolve path under root and ensure it stays inside root.
 * Section 25.1: sanitize paths, prevent path traversal.
 */
export function resolveSafePath(rootDir: string, relativePath: string): string {
  const normalizedRoot = path.resolve(rootDir);
  const resolved = path.resolve(normalizedRoot, relativePath);
  if (!resolved.startsWith(normalizedRoot)) {
    throw new Error("Path traversal not allowed");
  }
  return resolved;
}

/**
 * Check if a storage key (logical key, not filesystem path) is safe:
 * no '..', no absolute paths, no leading slashes that could break providers.
 */
export function isSafeStorageKey(storageKey: string): boolean {
  const trimmed = (storageKey || "").trim();
  if (trimmed === "" || trimmed.includes("..")) return false;
  if (path.isAbsolute(trimmed)) return false;
  if (trimmed.startsWith("/") && trimmed.length > 1) return false;
  return true;
}
