"use client";

// "CV sent" box in the Details card: the exact CV file that went to this company.
import { DownloadIcon, EyeIcon } from "@/components/icons";
import { cvPreviewTarget, hasCv } from "@/components/files/FileParts";
import { usePreview } from "@/components/files/FilePreview";
import type { Application } from "@/lib/app-types";
import { fileUrl } from "@/lib/uploads";

export function CvBox({ app, onReplace }: { app: Application; onReplace: () => void }) {
  const openPreview = usePreview();
  const has = hasCv(app);
  const name = app.cvFile?.name ?? app.cvFileName ?? "";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 10, background: "oklch(1 0 0 / 0.04)", border: "1px solid var(--border-soft)", borderRadius: 9 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
        <span style={{ color: "var(--text-faint)" }}>CV sent</span>
        <span onClick={onReplace} style={{ fontSize: 10.5, fontWeight: 700, color: "var(--accent)", cursor: "pointer" }}>
          {has ? "Replace" : "Attach CV"}
        </span>
      </div>
      {has ? (
        <>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button type="button" className="soft-btn" style={{ flex: 1 }} onClick={() => openPreview(cvPreviewTarget(app, onReplace))}>
              <EyeIcon /> Preview
            </button>
            {app.cvFile && (
              <a className="soft-btn" style={{ flex: 1 }} href={fileUrl(app.cvFile.id, true)} download={app.cvFile.name}>
                <DownloadIcon /> Download
              </a>
            )}
          </div>
        </>
      ) : (
        <div style={{ fontSize: 11, color: "var(--text-faint)" }}>No CV attached to this application yet.</div>
      )}
    </div>
  );
}
