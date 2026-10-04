// Client-side helpers for talking to the file endpoints.
import type { FileMeta } from "./app-types";

export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const CV_ACCEPT = ".pdf,.doc,.docx";
export const EMAIL_ACCEPT = ".eml,.msg,.pdf,.txt,.png,.jpg,.jpeg,.webp,.gif";
export const ASSIGNMENT_ACCEPT = ".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.webp,.gif";

/** URL that serves a stored file (inline for previewable types; `download` forces a save dialog). */
export function fileUrl(id: string, download = false) {
  return `/api/files/${id}${download ? "?download=1" : ""}`;
}

export function fmtSize(bytes: number) {
  return bytes < 1048576 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1048576).toFixed(1)} MB`;
}

export function fileExt(name: string) {
  return (name.includes(".") ? name.split(".").pop()! : "file").slice(0, 4).toUpperCase();
}

/** Reads an error message out of a failed API response, falling back to `fallback`. */
export async function apiError(res: Response, fallback: string) {
  const data = await res.json().catch(() => null);
  return typeof data?.error === "string" ? data.error : fallback;
}

/** Upload one file to /api/files. Rejects with a user-facing Error. */
export async function uploadFile(file: File): Promise<FileMeta> {
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("File is too large — the limit is 4 MB.");
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/files", { method: "POST", body: form });
  if (!res.ok) throw new Error(await apiError(res, "Upload failed."));
  return (await res.json()).file as FileMeta;
}

/** Opens the native file picker; resolves with the chosen files ([] if cancelled). Call from a click handler. */
export function pickFiles(accept: string, multiple = false): Promise<File[]> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = accept;
    input.multiple = multiple;
    input.onchange = () => resolve(Array.from(input.files ?? []));
    input.oncancel = () => resolve([]);
    input.click();
  });
}

/** Drag-and-drop wiring for an element that accepts files. */
export function dropProps(onFiles: (files: File[]) => void, multiple = false) {
  return {
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files ?? []);
      if (files.length) onFiles(multiple ? files : files.slice(0, 1));
    },
  };
}
