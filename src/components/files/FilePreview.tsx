"use client";

// Shared file viewer: PDFs in an iframe, images inline, text/emails as monospace; Word/Outlook
// files fall back to a download prompt, and name-only records offer "Attach the file".
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CloseIcon, DownloadIcon, UploadArrowIcon } from "@/components/icons";
import { fileExt, fileUrl } from "@/lib/uploads";

export type PreviewTarget = {
  name: string;
  /** Subtitle under the file name, e.g. "Stripe · Senior Frontend Engineer". */
  title?: string;
  fileId?: string | null;
  mime?: string | null;
  /** Pasted email text — shown directly, no fetch. */
  text?: string | null;
  /** Offered when only the name is on record (no bytes). */
  onAttach?: () => void;
};

type Kind = "pdf" | "image" | "text" | "noinline" | "missing";

function kindOf(t: PreviewTarget): Kind {
  if (t.text != null) return "text";
  if (!t.fileId) return "missing";
  const mime = t.mime ?? "";
  const ext = t.name.split(".").pop()?.toLowerCase() ?? "";
  if (mime === "application/pdf" || ext === "pdf") return "pdf";
  if (mime.startsWith("image/")) return "image";
  if (mime === "text/plain" || mime === "message/rfc822" || ext === "txt" || ext === "eml") return "text";
  return "noinline";
}

const PreviewContext = createContext<{ openPreview: (t: PreviewTarget) => void } | null>(null);

export function usePreview() {
  const ctx = useContext(PreviewContext);
  if (!ctx) throw new Error("usePreview must be used inside <PreviewProvider>");
  return ctx.openPreview;
}

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<PreviewTarget | null>(null);
  const openPreview = useCallback((t: PreviewTarget) => setTarget(t), []);
  const value = useMemo(() => ({ openPreview }), [openPreview]);

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setTarget(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [target]);

  return (
    <PreviewContext.Provider value={value}>
      {children}
      {target && <PreviewModal target={target} onClose={() => setTarget(null)} />}
    </PreviewContext.Provider>
  );
}

function PreviewModal({ target, onClose }: { target: PreviewTarget; onClose: () => void }) {
  const kind = kindOf(target);
  const [text, setText] = useState<string | null>(target.text ?? null);
  const [textError, setTextError] = useState(false);

  useEffect(() => {
    if (kind !== "text" || target.text != null || !target.fileId) return;
    let cancelled = false;
    fetch(fileUrl(target.fileId))
      .then((r) => (r.ok ? r.text() : Promise.reject(new Error("fetch failed"))))
      .then((t) => !cancelled && setText(t.slice(0, 200_000)))
      .catch(() => !cancelled && setTextError(true));
    return () => {
      cancelled = true;
    };
  }, [kind, target.fileId, target.text]);

  const ext = fileExt(target.name);
  const centered = { height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, padding: 30, textAlign: "center" } as const;

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "oklch(0.12 0.015 230 / 0.6)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 70, padding: 24 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`Preview of ${target.name}`}
        style={{ width: 900, maxWidth: "100%", height: "86vh", display: "flex", flexDirection: "column", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden", backdropFilter: "blur(28px) saturate(150%)", WebkitBackdropFilter: "blur(28px) saturate(150%)", boxShadow: "0 30px 70px oklch(0 0 0 / 0.45)", animation: "modalIn 0.22s ease both" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px 13px 20px", borderBottom: "1px solid var(--border-soft)", flex: "none" }}>
          <span style={{ flex: "none", fontFamily: "var(--font-mono)", fontSize: 9.5, fontWeight: 700, color: "var(--accent)", background: "var(--accent-soft)", padding: "4px 7px", borderRadius: 5 }}>{ext}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{target.name}</div>
            {target.title && <div style={{ fontSize: 11, color: "var(--text-faint)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{target.title}</div>}
          </div>
          {target.fileId && (
            <a href={fileUrl(target.fileId, true)} download={target.name} className="soft-btn">
              <DownloadIcon /> Download
            </a>
          )}
          <button type="button" onClick={onClose} aria-label="Close preview" style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "var(--surface2)", border: 0 }}>
            <CloseIcon size={9} />
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, background: "oklch(0 0 0 / 0.18)", position: "relative" }}>
          {kind === "pdf" && target.fileId && <iframe src={fileUrl(target.fileId)} title="File preview" style={{ width: "100%", height: "100%", border: 0, background: "white", display: "block" }} />}
          {kind === "image" && target.fileId && (
            <div style={{ height: "100%", padding: 20, boxSizing: "border-box" }}>
              {/* eslint-disable-next-line @next/next/no-img-element -- served from our own authenticated endpoint */}
              <img src={fileUrl(target.fileId)} alt={target.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            </div>
          )}
          {kind === "text" && (
            <pre style={{ margin: 0, height: "100%", boxSizing: "border-box", overflow: "auto", padding: "22px 26px", fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.65, color: "var(--text)", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {textError ? "Couldn’t load this file." : text ?? "Loading…"}
            </pre>
          )}
          {kind === "noinline" && (
            <div style={centered}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>No in-browser preview for .{ext.toLowerCase()} files</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", maxWidth: 380, textWrap: "pretty" }}>Download it to open in Word or Outlook. Tip: attach a PDF export too — PDFs preview right here.</div>
            </div>
          )}
          {kind === "missing" && (
            <div style={centered}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>Only the file name is on record</div>
              <div style={{ fontSize: 12, color: "var(--text-dim)", maxWidth: 380, textWrap: "pretty" }}>This application has the CV&apos;s name but not the file itself. Attach the file to preview and download it.</div>
              {target.onAttach && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    target.onAttach?.();
                  }}
                  style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 9, background: "var(--accent)", color: "var(--on-accent)", fontSize: 12, fontWeight: 700, cursor: "pointer", border: 0, fontFamily: "inherit" }}
                >
                  <UploadArrowIcon /> Attach the file
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
