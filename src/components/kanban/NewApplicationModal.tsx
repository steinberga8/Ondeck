"use client";

import { useEffect, useState } from "react";
import { CloseIcon, EyeIcon, UploadArrowIcon } from "@/components/icons";
import { FieldLabel, ModalOverlay, PrimaryButton, TextArea, TextInput } from "@/components/app/ui";
import { usePreview } from "@/components/files/FilePreview";
import type { CvLibraryItem, FileMeta } from "@/lib/app-types";
import { linkSource } from "@/lib/app-logic";
import { CV_ACCEPT, dropProps, fmtSize, pickFiles, uploadFile } from "@/lib/uploads";
import type { NewApplicationInput } from "@/lib/useAppData";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

type CvChoice = {
  name: string;
  file: FileMeta | null;
  /** Library tag when picked from the library; absent for a freshly uploaded tailored CV. */
  libTag?: string;
};

const segBase = { textAlign: "center" as const, cursor: "pointer", fontWeight: 700 };

export function NewApplicationModal({ onClose, onCreate }: { onClose: () => void; onCreate: (input: NewApplicationInput) => Promise<unknown> }) {
  const openPreview = usePreview();
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [date, setDate] = useState(todayIso());
  const [desc, setDesc] = useState("");
  const [referral, setReferral] = useState(false);
  const [cv, setCv] = useState<CvChoice | null>(null);
  const [cvMode, setCvMode] = useState<"upload" | "lib">("upload");
  const [library, setLibrary] = useState<CvLibraryItem[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const detectedSource = linkSource(link || null);

  useEffect(() => {
    fetch("/api/cv-library")
      .then((r) => r.json())
      .then((d) => setLibrary(d.items ?? []))
      .catch(() => setLibrary([]));
  }, []);

  /** Delete a just-uploaded tailored CV that never got attached to an application. */
  function discardUpload(choice: CvChoice | null) {
    if (choice?.file && !choice.libTag) fetch(`/api/files/${choice.file.id}`, { method: "DELETE" }).catch(() => {});
  }

  function close() {
    discardUpload(cv);
    onClose();
  }

  async function takeFile(files: File[]) {
    const f = files[0];
    if (!f) return;
    setErr("");
    setUploading(true);
    try {
      const meta = await uploadFile(f);
      discardUpload(cv);
      setCv({ name: meta.name, file: meta });
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (!company.trim() || !title.trim()) {
      setErr("Company and title are required.");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      // A freshly uploaded tailored CV joins the library with the JOB tag, as in the design.
      if (cv?.file && !cv.libTag) {
        await fetch("/api/cv-library", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: cv.name, tag: "JOB", date, fileId: cv.file.id }),
        });
      }
      await onCreate({
        company: company.trim(),
        title: title.trim(),
        link: link.trim() || undefined,
        date,
        desc: desc.trim() || undefined,
        referral,
        cvFileId: cv?.file?.id,
        cvName: cv ? (cv.libTag ? `CV ${cv.libTag}` : "CV Tailored") : undefined,
      });
      onClose();
    } catch {
      setErr("Couldn't save this application. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const modeStyle = (on: boolean) => ({ ...segBase, padding: "4px 9px", borderRadius: 5, fontSize: 10.5, whiteSpace: "nowrap" as const, background: on ? "var(--accent)" : "transparent", color: on ? "var(--on-accent)" : "var(--text-dim)" });
  const refStyle = (on: boolean) => ({ ...segBase, flex: 1, padding: "7px 0", borderRadius: 6, fontSize: 12, background: on ? "var(--accent)" : "transparent", color: on ? "var(--on-accent)" : "var(--text-faint)" });

  return (
    <ModalOverlay onClose={close} width={520}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 800 }}>New Application</div>
        <button type="button" onClick={close} aria-label="Close" style={{ width: 26, height: 26, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "var(--surface2)", border: 0 }}>
          <CloseIcon size={12} />
        </button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {err && <div style={{ fontSize: 11.5, color: "oklch(0.68 0.19 25)", fontWeight: 600 }}>{err}</div>}
        <div>
          <FieldLabel>COMPANY NAME</FieldLabel>
          <TextInput value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Stripe" />
        </div>
        <div>
          <FieldLabel>TITLE</FieldLabel>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Frontend Engineer" />
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)" }}>JOB LINK</span>
            {detectedSource && (
              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent)", background: "var(--accent-soft)", padding: "2px 7px", borderRadius: 5 }}>{detectedSource}</span>
            )}
          </div>
          <TextInput value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://linkedin.com/jobs/… · glassdoor · company site" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }} />
        </div>
        <div>
          <FieldLabel>DATE OF APPLICATION</FieldLabel>
          <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, colorScheme: "dark" }} />
        </div>
        <div>
          <FieldLabel>
            JOB DESCRIPTION <span style={{ fontWeight: 500, color: "var(--text-faint)", opacity: 0.7 }}>(optional — powers ATS Match &amp; screening agent)</span>
          </FieldLabel>
          <TextArea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Paste the job description" rows={3} />
        </div>
        <div>
          <FieldLabel>IS IT A REFERRAL?</FieldLabel>
          <div style={{ display: "inline-flex", gap: 2, background: "var(--surface2)", border: "1px solid var(--border-soft)", borderRadius: 8, padding: 3 }}>
            <div onClick={() => setReferral(true)} style={{ ...refStyle(referral), minWidth: 44 }}>
              Yes
            </div>
            <div onClick={() => setReferral(false)} style={{ ...refStyle(!referral), minWidth: 44 }}>
              No
            </div>
          </div>
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 7 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)" }}>CV FOR THIS APPLICATION</span>
            <div style={{ display: "inline-flex", gap: 2, background: "var(--surface2)", border: "1px solid var(--border-soft)", borderRadius: 7, padding: 2 }}>
              <div onClick={() => setCvMode("upload")} style={modeStyle(cvMode === "upload")}>
                Upload tailored CV
              </div>
              <div onClick={() => setCvMode("lib")} style={modeStyle(cvMode === "lib")}>
                From library
              </div>
            </div>
          </div>

          {cv && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 6px 9px 12px", background: "var(--accent-soft)", border: "1px solid oklch(0.72 0.14 195 / 0.35)", borderRadius: 9, marginBottom: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--accent)", color: "var(--on-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, fontFamily: "var(--font-mono)", flex: "none" }}>CV</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cv.name}</div>
                <div style={{ fontSize: 10.5, color: "var(--text-dim)" }}>{cv.file ? `${fmtSize(cv.file.size)} · ${cv.libTag ? `library · ${cv.libTag}` : "will be saved to your CV library as JOB"}` : `library · ${cv.libTag} · name only, no file on record`}</div>
              </div>
              {cv.file && (
                <button type="button" className="icon-btn" title="Preview" onClick={() => openPreview({ name: cv.name, title: "Selected CV", fileId: cv.file!.id, mime: cv.file!.mime })}>
                  <EyeIcon />
                </button>
              )}
              <button
                type="button"
                className="icon-btn"
                title="Remove"
                onClick={() => {
                  discardUpload(cv);
                  setCv(null);
                }}
              >
                <CloseIcon size={9} color="currentColor" />
              </button>
            </div>
          )}

          {cvMode === "upload" && !cv && (
            <div
              onClick={async () => !uploading && takeFile(await pickFiles(CV_ACCEPT))}
              {...dropProps(takeFile)}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 11, padding: 16, background: "var(--surface2)", border: "1px dashed var(--border)", borderRadius: 9, cursor: uploading ? "default" : "pointer", color: "var(--text-dim)" }}
            >
              <UploadArrowIcon />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700 }}>{uploading ? "Uploading…" : "Upload the CV you tailored for this job"}</div>
                <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", color: "var(--text-faint)" }}>PDF · DOC · DOCX · up to 4 MB — click or drag &amp; drop</div>
              </div>
            </div>
          )}

          {cvMode === "lib" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 5, maxHeight: 176, overflowY: "auto" }}>
              {(library ?? []).map((item) => {
                const on = cv?.libTag === item.tag && cv.name === item.name;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      discardUpload(cv);
                      setCv({ name: item.name, file: item.file, libTag: item.tag });
                    }}
                    style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 10px", background: "var(--surface2)", border: `1px solid ${on ? "var(--accent)" : "var(--border-soft)"}`, borderRadius: 8, cursor: "pointer" }}
                  >
                    <span style={{ flex: "none", fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700, color: "var(--accent)", background: "var(--accent-soft)", padding: "2px 6px", borderRadius: 4 }}>{item.tag}</span>
                    <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</span>
                    <span style={{ flex: "none", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-faint)" }}>{item.date}</span>
                  </div>
                );
              })}
              {library && library.length === 0 && <div style={{ padding: 14, textAlign: "center", fontSize: 11.5, color: "var(--text-faint)" }}>Your CV library is empty — upload a tailored CV instead.</div>}
            </div>
          )}
        </div>

        <PrimaryButton onClick={submit} disabled={saving || uploading}>
          {saving ? "Adding…" : "Add Application"}
        </PrimaryButton>
      </div>
    </ModalOverlay>
  );
}
