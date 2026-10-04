"use client";

// "Notes & emails by stage": stage chips + All, per-stage notes, and emails attached as files or
// pasted text. Notes written before stages existed (no `stage`) appear under "All" as GENERAL.
import { useState } from "react";
import { PaperclipIcon, CloseIcon } from "@/components/icons";
import { FileRow } from "@/components/files/FileParts";
import { usePreview } from "@/components/files/FilePreview";
import type { Application, PipelineStage } from "@/lib/app-types";
import { fmtShort } from "@/lib/app-logic";
import { dropProps, EMAIL_ACCEPT, fmtSize, pickFiles } from "@/lib/uploads";
import type { useAppData } from "@/lib/useAppData";

type Actions = Pick<ReturnType<typeof useAppData>, "patchApp" | "attachEmailFile" | "attachEmailText" | "removeEmail">;

const labelStyle = { fontSize: 10, fontWeight: 800, letterSpacing: "0.05em", color: "var(--text-faint)" } as const;

export function StageLog({
  app,
  stages,
  logKey,
  onLogKey,
  patchApp,
  attachEmailFile,
  attachEmailText,
  removeEmail,
}: {
  app: Application;
  stages: PipelineStage[];
  logKey: string;
  onLogKey: (key: string) => void;
} & Actions) {
  const openPreview = usePreview();
  const [noteDraft, setNoteDraft] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const stageMap = new Map(stages.map((s) => [s.key, s]));
  const effectiveKey = logKey === "all" || stageMap.has(logKey) ? logKey : "all";
  // "All" adds to the application's current stage.
  const targetKey = effectiveKey === "all" ? app.stage : effectiveKey;
  const targetLabel = stageMap.get(targetKey)?.label ?? targetKey;

  const countFor = (key: string) => app.notes.filter((n) => n.stage === key).length + app.emails.filter((m) => m.stageKey === key).length;
  const generalCount = app.notes.filter((n) => !n.stage || !stageMap.has(n.stage)).length;
  const chips = [
    { key: "all", label: "All", color: "var(--accent)", count: generalCount + stages.reduce((n, s) => n + countFor(s.key), 0) },
    ...stages.map((s) => ({ key: s.key, label: s.label, color: s.color, count: countFor(s.key) })),
  ];

  // Keep each note's index in the stored array so removal targets the right one.
  const notes = app.notes
    .map((n, index) => ({ ...n, index }))
    .filter((n) => (effectiveKey === "all" ? true : n.stage === effectiveKey))
    .map((n) => {
      const st = n.stage ? stageMap.get(n.stage) : undefined;
      return { ...n, stageLabel: st ? st.label.toUpperCase() : "GENERAL", stageColor: st?.color ?? "var(--text-faint)", canRemove: !!st };
    });
  const mails = app.emails.filter((m) => (effectiveKey === "all" ? stageMap.has(m.stageKey) : m.stageKey === effectiveKey));

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setErr("");
    try {
      await fn();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const addNote = () => {
    const text = noteDraft.trim();
    if (!text) return;
    return run(async () => {
      await patchApp(app.id, { appendNote: { text, stage: targetKey } });
      setNoteDraft("");
    });
  };

  const attachFiles = (files: File[]) =>
    run(async () => {
      for (const f of files) await attachEmailFile(app.id, targetKey, f);
    });

  const savePaste = () => {
    const text = pasteText.trim();
    if (!text) return;
    return run(async () => {
      await attachEmailText(app.id, targetKey, text);
      setPasteText("");
      setPasteOpen(false);
    });
  };

  const empty = notes.length === 0 && mails.length === 0;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 12, padding: "16px 18px" }} {...dropProps(attachFiles, true)}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Notes &amp; emails by stage</div>
        <div style={{ fontSize: 10.5, color: "var(--text-faint)" }}>Adding to: {targetLabel}</div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
        {chips.map((c) => {
          const on = c.key === effectiveKey;
          return (
            <div
              key={c.key}
              onClick={() => {
                onLogKey(c.key);
                setPasteOpen(false);
              }}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 11px", borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: "pointer", background: on ? "oklch(1 0 0 / 0.08)" : "transparent", color: on ? "var(--text)" : "var(--text-dim)", border: `1px solid ${on ? c.color : "var(--border-soft)"}` }}
            >
              {c.label}
              {c.count > 0 && <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, opacity: 0.75 }}>{c.count}</span>}
            </div>
          );
        })}
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          value={noteDraft}
          onChange={(e) => setNoteDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addNote()}
          placeholder={`Add a note for ${targetLabel}…`}
          style={{ flex: 1, minWidth: 0, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 11px", color: "var(--text)", fontFamily: "var(--font-ui)", fontSize: 12.5, outline: "none" }}
        />
        <div onClick={addNote} style={{ flex: "none", display: "flex", alignItems: "center", padding: "0 14px", borderRadius: 8, background: "var(--accent)", color: "var(--on-accent)", fontSize: 11.5, fontWeight: 700, cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1 }}>
          Add note
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14, alignItems: "center" }}>
        <button type="button" className="soft-btn" onClick={async () => attachFiles(await pickFiles(EMAIL_ACCEPT, true))}>
          <PaperclipIcon /> Attach email file
        </button>
        <button type="button" className="soft-btn" onClick={() => setPasteOpen((v) => !v)}>
          Paste email text
        </button>
        <span style={{ fontSize: 10, color: "var(--text-faint)" }}>.eml · .msg · .pdf · screenshots — or drop them here</span>
      </div>

      {err && <div style={{ fontSize: 11.5, color: "oklch(0.68 0.19 25)", fontWeight: 600, marginBottom: 10 }}>{err}</div>}

      {pasteOpen && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            rows={5}
            placeholder="Paste the email here — keep the Subject: and From: lines if you have them"
            style={{ width: "100%", resize: "vertical", lineHeight: 1.5, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 11px", color: "var(--text)", fontFamily: "var(--font-ui)", fontSize: 12.5, outline: "none" }}
          />
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button type="button" className="soft-btn" onClick={() => setPasteOpen(false)}>
              Cancel
            </button>
            <div onClick={savePaste} style={{ display: "flex", alignItems: "center", padding: "7px 14px", borderRadius: 8, background: "var(--accent)", color: "var(--on-accent)", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}>
              Save email
            </div>
          </div>
        </div>
      )}

      {empty && (
        <div style={{ padding: "12px 0 4px", textAlign: "center", fontSize: 12, color: "var(--text-faint)", textWrap: "pretty" }}>
          Nothing logged for {effectiveKey === "all" ? "this application" : stageMap.get(effectiveKey)?.label} yet — add a note or attach the emails you exchanged.
        </div>
      )}

      {mails.length > 0 && (
        <>
          <div style={{ ...labelStyle, marginBottom: 7 }}>EMAILS · {mails.length}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
            {mails.map((m) => {
              const stageLabel = effectiveKey === "all" ? stageMap.get(m.stageKey)?.label : null;
              return (
                <FileRow
                  key={m.id}
                  name={m.name}
                  title={m.subject || m.name}
                  meta={[stageLabel, m.sender, m.createdAt.slice(0, 10), m.file ? fmtSize(m.file.size) : m.body ? `${Math.max(1, Math.round(m.body.length / 1024))} KB` : null].filter(Boolean).join(" · ")}
                  fileId={m.file?.id}
                  onPreview={() => openPreview({ name: m.name, title: m.subject || m.name, fileId: m.file?.id ?? null, mime: m.file?.mime ?? null, text: m.body })}
                  onRemove={() => run(() => removeEmail(app.id, m.id))}
                />
              );
            })}
          </div>
        </>
      )}

      {notes.length > 0 && (
        <>
          <div style={{ ...labelStyle, marginBottom: 2 }}>NOTES · {notes.length}</div>
          {notes.map((n) => (
            <div key={n.index} style={{ display: "flex", gap: 10, padding: "9px 0", borderBottom: "1px solid var(--border-soft)" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-faint)", flex: "none", width: 46, paddingTop: 1 }}>{n.date.length === 5 ? fmtShort(`${new Date().getFullYear()}-${n.date}`) : n.date}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                {effectiveKey === "all" && <div style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: "0.05em", color: n.stageColor, marginBottom: 2 }}>{n.stageLabel}</div>}
                <div style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{n.text}</div>
              </div>
              {n.canRemove && (
                <button type="button" className="icon-btn danger" title="Delete note" onClick={() => run(() => patchApp(app.id, { removeNoteIndex: n.index }))}>
                  <CloseIcon size={9} color="currentColor" />
                </button>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
