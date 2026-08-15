"use client";

import { useState } from "react";
import { FieldLabel, ModalOverlay, PrimaryButton, TextArea, TextInput, inputStyle } from "@/components/app/ui";
import type { PipelineStage } from "@/lib/app-types";

export function StageModal({
  stages,
  onClose,
  onCreate,
}: {
  stages: PipelineStage[];
  onClose: () => void;
  onCreate: (input: { label: string; desc?: string; afterKey: string }) => Promise<unknown>;
}) {
  const [label, setLabel] = useState("");
  const [desc, setDesc] = useState("");
  const [afterKey, setAfterKey] = useState(stages[stages.length - 1]?.key ?? "applied");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!label.trim()) {
      setErr("Step name is required.");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      await onCreate({ label: label.trim(), desc: desc.trim() || undefined, afterKey });
      onClose();
    } catch {
      setErr("Couldn't add this step. Try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalOverlay onClose={onClose} width={440}>
      <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 18 }}>Add a Step</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {err && <div style={{ fontSize: 11.5, color: "oklch(0.68 0.19 25)", fontWeight: 600 }}>{err}</div>}
        <div>
          <FieldLabel>STEP NAME</FieldLabel>
          <TextInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Technical Test, 2nd Interview" />
        </div>
        <div>
          <FieldLabel>WHAT HAPPENS IN THIS STEP?</FieldLabel>
          <TextArea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Short description shown on the column" rows={2} />
        </div>
        <div>
          <FieldLabel>POSITION</FieldLabel>
          <select value={afterKey} onChange={(e) => setAfterKey(e.target.value)} style={{ ...inputStyle, cursor: "pointer", fontWeight: 600 }}>
            {stages.map((st) => (
              <option key={st.key} value={st.key}>
                After {st.label}
              </option>
            ))}
          </select>
          <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 5 }}>A step can go anywhere in the pipeline — except before Applied.</div>
        </div>
        <PrimaryButton onClick={submit} disabled={saving}>
          {saving ? "Adding…" : "Add Step"}
        </PrimaryButton>
      </div>
    </ModalOverlay>
  );
}
