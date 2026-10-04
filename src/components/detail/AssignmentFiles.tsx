"use client";

// Home Assignment: two upload slots — the brief they sent, and what you handed in.
import { useState } from "react";
import { UploadArrowIcon } from "@/components/icons";
import { FileRow } from "@/components/files/FileParts";
import { usePreview } from "@/components/files/FilePreview";
import type { Application, AssignmentSlot } from "@/lib/app-types";
import { ASSIGNMENT_ACCEPT, dropProps, fmtSize, pickFiles } from "@/lib/uploads";
import type { useAppData } from "@/lib/useAppData";

const SLOTS: { key: AssignmentSlot; label: string; hint: string; cta: string }[] = [
  { key: "brief", label: "ASSIGNMENT BRIEF", hint: "what they sent you", cta: "Attach brief" },
  { key: "submission", label: "YOUR SUBMISSION", hint: "what you handed in", cta: "Attach submission" },
];

export function AssignmentFiles({
  app,
  addAssignmentFile,
  removeAssignmentFile,
}: { app: Application } & Pick<ReturnType<typeof useAppData>, "addAssignmentFile" | "removeAssignmentFile">) {
  const openPreview = usePreview();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function upload(slot: AssignmentSlot, files: File[]) {
    if (!files.length) return;
    setBusy(true);
    setErr("");
    try {
      for (const f of files) await addAssignmentFile(app.id, slot, f);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 170px), 1fr))", gap: 10 }}>
        {SLOTS.map((slot) => {
          const files = app.assignmentFiles.filter((f) => f.slot === slot.key);
          return (
            <div key={slot.key} style={{ display: "flex", flexDirection: "column", gap: 7, padding: 11, background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 10 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                <span style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.05em", color: "var(--text-dim)" }}>{slot.label}</span>
                <span style={{ fontSize: 10, color: "var(--text-faint)" }}>{slot.hint}</span>
              </div>
              {files.map((f) => (
                <FileRow
                  key={f.id}
                  name={f.file.name}
                  title={f.file.name}
                  meta={[f.createdAt.slice(0, 10), fmtSize(f.file.size)].join(" · ")}
                  fileId={f.file.id}
                  onPreview={() => openPreview({ name: f.file.name, title: `${app.company} · ${slot.label.toLowerCase()}`, fileId: f.file.id, mime: f.file.mime })}
                  onRemove={() => removeAssignmentFile(app.id, f.id).catch((e) => setErr(e instanceof Error ? e.message : "Couldn’t remove that file."))}
                />
              ))}
              <div
                onClick={async () => !busy && upload(slot.key, await pickFiles(ASSIGNMENT_ACCEPT, true))}
                {...dropProps((fs) => upload(slot.key, fs), true)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, padding: 10, border: "1px dashed var(--border)", borderRadius: 8, cursor: busy ? "default" : "pointer", fontSize: 11.5, color: "var(--text-dim)", fontWeight: 600 }}
              >
                <UploadArrowIcon />
                {busy ? "Uploading…" : slot.cta}
              </div>
            </div>
          );
        })}
      </div>
      {err && <div style={{ fontSize: 11.5, color: "oklch(0.68 0.19 25)", fontWeight: 600, marginTop: 8 }}>{err}</div>}
    </>
  );
}
