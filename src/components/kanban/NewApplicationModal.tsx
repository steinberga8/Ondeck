"use client";

import { useState } from "react";
import { FieldLabel, ModalOverlay, PrimaryButton, TextArea, TextInput } from "@/components/app/ui";
import { linkSource } from "@/lib/app-logic";
import type { NewApplicationInput } from "@/lib/useAppData";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function NewApplicationModal({ onClose, onCreate }: { onClose: () => void; onCreate: (input: NewApplicationInput) => Promise<unknown> }) {
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [date, setDate] = useState(todayIso());
  const [desc, setDesc] = useState("");
  const [referral, setReferral] = useState(false);
  const [cvName, setCvName] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const detectedSource = linkSource(link || null);

  async function submit() {
    if (!company.trim() || !title.trim()) {
      setErr("Company and title are required.");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      await onCreate({ company: company.trim(), title: title.trim(), link: link.trim() || undefined, date, desc: desc.trim() || undefined, referral, cvName: cvName.trim() || undefined });
      onClose();
    } catch {
      setErr("Couldn't save this application. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const segBase = { flex: 1, textAlign: "center" as const, padding: "7px 0", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer" };

  return (
    <ModalOverlay onClose={onClose} width={520}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div style={{ fontSize: 15, fontWeight: 800 }}>New Application</div>
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
              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--accent)", background: "var(--accent-soft)", padding: "2px 7px", borderRadius: 5 }}>
                {detectedSource}
              </span>
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
            <div onClick={() => setReferral(true)} style={{ ...segBase, background: referral ? "var(--accent)" : "transparent", color: referral ? "var(--on-accent)" : "var(--text-faint)" }}>
              Yes
            </div>
            <div onClick={() => setReferral(false)} style={{ ...segBase, background: !referral ? "var(--accent)" : "transparent", color: !referral ? "var(--on-accent)" : "var(--text-faint)" }}>
              No
            </div>
          </div>
        </div>
        <div>
          <FieldLabel>CV VERSION / FILE NAME (OPTIONAL)</FieldLabel>
          <TextInput value={cvName} onChange={(e) => setCvName(e.target.value)} placeholder="e.g. CV v3, or the CV filename you sent" style={{ fontFamily: "var(--font-mono)", fontSize: 12 }} />
          <div style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 5 }}>Ondeck doesn&apos;t store file uploads — this is just a label to tell CV versions apart.</div>
        </div>
        <PrimaryButton onClick={submit} disabled={saving}>
          {saving ? "Adding…" : "Add Application"}
        </PrimaryButton>
      </div>
    </ModalOverlay>
  );
}
