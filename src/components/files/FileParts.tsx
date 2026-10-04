"use client";

import { DownloadIcon, EyeIcon, CloseIcon } from "@/components/icons";
import { usePreview, type PreviewTarget } from "@/components/files/FilePreview";
import type { Application, FileMeta } from "@/lib/app-types";
import { fileExt, fileUrl } from "@/lib/uploads";

/** A file row: extension chip, title/meta, and preview / download / remove actions. */
export function FileRow({
  name,
  title,
  meta,
  onPreview,
  fileId,
  onRemove,
}: {
  name: string;
  title: string;
  meta: string;
  onPreview: () => void;
  fileId?: string | null;
  onRemove?: () => void;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 5px 7px 9px", background: "oklch(1 0 0 / 0.04)", border: "1px solid var(--border-soft)", borderRadius: 8 }}>
      <span style={{ flex: "none", fontFamily: "var(--font-mono)", fontSize: 8.5, fontWeight: 700, color: "var(--accent)", background: "var(--accent-soft)", padding: "3px 5px", borderRadius: 4 }}>{fileExt(name)}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{title}</div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: "var(--text-faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{meta}</div>
      </div>
      <button type="button" className="icon-btn" title="Preview" onClick={onPreview}>
        <EyeIcon />
      </button>
      {fileId && (
        <a className="icon-btn" title="Download" href={fileUrl(fileId, true)} download={name}>
          <DownloadIcon />
        </a>
      )}
      {onRemove && (
        <button type="button" className="icon-btn danger" title="Remove" onClick={onRemove}>
          <CloseIcon size={9} color="currentColor" />
        </button>
      )}
    </div>
  );
}

/** What the preview modal should show for an application's CV (a real file, or just a name on record). */
export function cvPreviewTarget(app: Pick<Application, "company" | "role" | "cvFile" | "cvFileName">, onAttach?: () => void): PreviewTarget {
  const file: FileMeta | null = app.cvFile;
  return {
    name: file?.name ?? app.cvFileName ?? "CV",
    title: `${app.company} · ${app.role}`,
    fileId: file?.id ?? null,
    mime: file?.mime ?? null,
    onAttach,
  };
}

/** True when the application has a CV on record — a real file, or an imported name only. */
export function hasCv(app: Pick<Application, "cvFile" | "cvFileName">) {
  return !!(app.cvFile || app.cvFileName);
}

/** Compact "CV file · preview · download" strip shown on Kanban cards. */
export function CvChip({ app, onAttach }: { app: Application; onAttach?: () => void }) {
  const openPreview = usePreview();
  if (!hasCv(app)) return null;
  const name = app.cvFile?.name ?? app.cvFileName ?? "";
  return (
    <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 10, padding: "3px 3px 3px 8px", background: "oklch(1 0 0 / 0.04)", border: "1px solid var(--border-soft)", borderRadius: 7, cursor: "default" }}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flex: "none" }}>
        <path d="M6 2h8l5 5v15H6z" stroke="var(--accent)" strokeWidth="1.8" strokeLinejoin="round" />
        <path d="M14 2v5h5" stroke="var(--accent)" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
      <span style={{ flex: 1, minWidth: 0, marginLeft: 2, fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</span>
      <button type="button" className="icon-btn" title="Preview CV" onClick={() => openPreview(cvPreviewTarget(app, onAttach))}>
        <EyeIcon />
      </button>
      {app.cvFile && (
        <a className="icon-btn" title="Download CV" href={fileUrl(app.cvFile.id, true)} download={app.cvFile.name}>
          <DownloadIcon />
        </a>
      )}
    </div>
  );
}
