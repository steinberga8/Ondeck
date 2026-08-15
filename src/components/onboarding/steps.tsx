"use client";

import type { CSSProperties, RefObject } from "react";
import { FieldLabel, TextInput } from "@/components/onboarding/ui";
import { UploadIcon, CloseIcon } from "@/components/icons";

const FIELD_OPTIONS = ["Tech", "Medicine", "Education", "Finance", "Design", "Marketing", "Legal", "Sales", "Other"];
const EXP_OPTIONS = ["Student / New grad", "Junior · 0–2 yrs", "Mid · 3–5 yrs", "Senior · 6–9 yrs", "Lead · 10+ yrs"];

export type ObCv = { id: string; tag: string; name: string; size: string };

export function FocusStep({ fields, onToggle }: { fields: string[]; onToggle: (label: string) => void }) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>What are you looking for?</div>
      <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginBottom: 20 }}>
        Pick every field that applies — this tunes suggestions and the screening agent.
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {FIELD_OPTIONS.map((label) => {
          const sel = fields.includes(label);
          return (
            <div
              key={label}
              onClick={() => onToggle(label)}
              style={{
                padding: "8px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background: sel ? "var(--accent)" : "var(--surface2)",
                color: sel ? "var(--on-accent)" : "var(--text-dim)",
                border: sel ? "1px solid var(--accent)" : "1px solid var(--border)",
              }}
            >
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ExperienceStep({
  exp,
  title,
  onPick,
  onTitle,
}: {
  exp: string | null;
  title: string;
  onPick: (label: string) => void;
  onTitle: (v: string) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Your experience</div>
      <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginBottom: 20 }}>
        Used to benchmark your pipeline against similar profiles.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        {EXP_OPTIONS.map((label) => {
          const sel = exp === label;
          return (
            <div
              key={label}
              onClick={() => onPick(label)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "11px 14px",
                borderRadius: 9,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: "pointer",
                background: sel ? "var(--accent-soft)" : "var(--surface2)",
                border: sel ? "1px solid var(--accent)" : "1px solid var(--border-soft)",
                color: sel ? "var(--text)" : "var(--text-dim)",
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  border: `2px solid ${sel ? "var(--accent)" : "var(--border)"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "none",
                }}
              >
                {sel && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--accent)" }} />}
              </div>
              <span>{label}</span>
            </div>
          );
        })}
      </div>
      <div>
        <FieldLabel>CURRENT / LAST TITLE</FieldLabel>
        <TextInput value={title} onChange={(e) => onTitle(e.target.value)} placeholder="e.g. Frontend Engineer" />
      </div>
    </div>
  );
}

function fmtSize(bytes: number) {
  return bytes < 1024 * 1024 ? Math.max(1, Math.round(bytes / 1024)) + " KB" : (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export function CvsStep({
  cvs,
  inputRef,
  onFiles,
  onRemove,
}: {
  cvs: ObCv[];
  inputRef: RefObject<HTMLInputElement | null>;
  onFiles: (files: FileList | null) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Your CVs</div>
      <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginBottom: 20 }}>
        Upload the versions you use — Ondeck tracks response rate per version so you know which one works.
      </div>
      <input
        type="file"
        multiple
        accept=".pdf,.doc,.docx"
        ref={inputRef}
        onChange={(e) => {
          onFiles(e.target.files);
          e.target.value = "";
        }}
        style={{ display: "none" }}
      />
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFiles(e.dataTransfer.files);
        }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          padding: 26,
          background: "var(--surface2)",
          border: "1px dashed var(--border)",
          borderRadius: 10,
          cursor: "pointer",
          marginBottom: 12,
        }}
      >
        <UploadIcon size={20} />
        <div style={{ fontSize: 12, color: "var(--text-dim)", fontWeight: 600 }}>Drop a CV here or click to add</div>
        <div style={{ fontSize: 10.5, color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>PDF · DOCX</div>
      </div>
      {cvs.map((cv) => (
        <div
          key={cv.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 12px",
            border: "1px solid var(--border-soft)",
            borderRadius: 8,
            marginBottom: 6,
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: "var(--accent-soft)",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 700,
              fontFamily: "var(--font-mono)",
              flex: "none",
            }}
          >
            {cv.tag}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {cv.name}
            </div>
            <div style={{ fontSize: 10, color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>{cv.size}</div>
          </div>
          <div style={{ fontSize: 10.5, color: "var(--green)", fontFamily: "var(--font-mono)", flex: "none" }}>uploaded</div>
          <div
            onClick={() => onRemove(cv.id)}
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              background: "var(--surface2)",
              flex: "none",
            }}
          >
            <CloseIcon />
          </div>
        </div>
      ))}
    </div>
  );
}

export function toObCv(file: File, index: number): ObCv {
  return { id: `${Date.now()}-${index}`, tag: `v${index + 1}`, name: file.name, size: fmtSize(file.size) };
}

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  const style: CSSProperties = {
    width: 36,
    height: 20,
    borderRadius: 20,
    background: on ? "var(--accent)" : "var(--surface3)",
    padding: 2,
    display: "flex",
    justifyContent: on ? "flex-end" : "flex-start",
    flex: "none",
    transition: "background 0.15s",
    cursor: "pointer",
  };
  return (
    <div onClick={onClick} style={style}>
      <div style={{ width: 16, height: 16, borderRadius: "50%", background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
    </div>
  );
}

export function ConnectStep({
  li,
  mail,
  onToggleLi,
  onToggleMail,
}: {
  li: boolean;
  mail: boolean;
  onToggleLi: () => void;
  onToggleMail: () => void;
}) {
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Connect your accounts</div>
      <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginBottom: 20 }}>
        Ondeck watches LinkedIn and your inbox for replies and moves applications forward automatically.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <div
          onClick={onToggleLi}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            background: "var(--surface2)",
            border: "1px solid var(--border-soft)",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "oklch(0.55 0.12 250)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              fontSize: 13,
              color: "white",
              flex: "none",
            }}
          >
            in
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>LinkedIn</div>
            <div style={{ fontSize: 11, color: "var(--text-faint)" }}>Import applications &amp; recruiter messages</div>
          </div>
          <Toggle on={li} onClick={onToggleLi} />
        </div>
        <div
          onClick={onToggleMail}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 16px",
            background: "var(--surface2)",
            border: "1px solid var(--border-soft)",
            borderRadius: 10,
            cursor: "pointer",
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: "var(--surface3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flex: "none",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="5" width="18" height="14" rx="2" stroke="var(--text-dim)" strokeWidth="1.8" />
              <path d="M3 7L12 13L21 7" stroke="var(--text-dim)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>Mail</div>
            <div style={{ fontSize: 11, color: "var(--text-faint)" }}>Detect interview invites &amp; rejections</div>
          </div>
          <Toggle on={mail} onClick={onToggleMail} />
        </div>
      </div>
    </div>
  );
}

export type BillingDraft = {
  method: "card" | "paypal" | "applepay";
  firstName: string;
  lastName: string;
  cardNumber: string;
  cvv: string;
  expiry: string;
};

export function BillingStep({ draft, onChange }: { draft: BillingDraft; onChange: (patch: Partial<BillingDraft>) => void }) {
  const methodBtn = (key: BillingDraft["method"]): CSSProperties => ({
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: 11,
    borderRadius: 9,
    cursor: "pointer",
    fontSize: 12.5,
    fontWeight: 700,
    border: draft.method === key ? "1px solid var(--accent)" : "1px solid var(--border)",
    background: draft.method === key ? "var(--accent-soft)" : "var(--surface2)",
    color: draft.method === key ? "var(--accent)" : "var(--text-dim)",
  });
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Add a payment method</div>
      <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginBottom: 14 }}>
        Optional — you get 14 days completely free either way.
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 10,
          padding: "12px 14px",
          background: "var(--amber-soft)",
          border: "1px solid oklch(0.78 0.13 82 / 0.35)",
          borderRadius: 10,
          marginBottom: 18,
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ flex: "none", marginTop: 1 }}>
          <circle cx="12" cy="12" r="9" stroke="var(--amber)" strokeWidth="1.8" />
          <line x1="12" y1="8" x2="12" y2="13" stroke="var(--amber)" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="16.3" r="1" fill="var(--amber)" />
        </svg>
        <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.55 }}>
          Skipping this is fine — but if you don&apos;t add a payment method, your{" "}
          <strong style={{ color: "var(--text)", fontWeight: 700 }}>14-day free trial will expire</strong> and{" "}
          <strong style={{ color: "var(--text)", fontWeight: 700 }}>all your tracked applications, analytics and CVs will be deleted</strong>.
          Add one now to keep everything for $5/month after the trial, cancel anytime.
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
        <div onClick={() => onChange({ method: "card" })} style={methodBtn("card")}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" />
            <line x1="2" y1="9.5" x2="22" y2="9.5" stroke="currentColor" strokeWidth="1.7" />
          </svg>
          Card
        </div>
        <div onClick={() => onChange({ method: "paypal" })} style={methodBtn("paypal")}>
          PayPal
        </div>
        <div onClick={() => onChange({ method: "applepay" })} style={methodBtn("applepay")}>
          Apple Pay
        </div>
      </div>

      {draft.method === "card" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 14px", marginBottom: 14 }}>
            <div>
              <FieldLabel>FIRST NAME</FieldLabel>
              <TextInput value={draft.firstName} onChange={(e) => onChange({ firstName: e.target.value })} />
            </div>
            <div>
              <FieldLabel>LAST NAME</FieldLabel>
              <TextInput value={draft.lastName} onChange={(e) => onChange({ lastName: e.target.value })} />
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <FieldLabel>CARD NUMBER</FieldLabel>
            <TextInput
              value={draft.cardNumber}
              onChange={(e) => onChange({ cardNumber: e.target.value })}
              placeholder="•••• •••• •••• ••••"
              style={{ fontFamily: "var(--font-mono)" }}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <FieldLabel>CVV</FieldLabel>
              <TextInput
                value={draft.cvv}
                onChange={(e) => onChange({ cvv: e.target.value })}
                placeholder="•••"
                style={{ fontFamily: "var(--font-mono)" }}
              />
            </div>
            <div>
              <FieldLabel>EXPIRATION</FieldLabel>
              <TextInput
                value={draft.expiry}
                onChange={(e) => onChange({ expiry: e.target.value })}
                placeholder="MM / YY"
                style={{ fontFamily: "var(--font-mono)" }}
              />
            </div>
          </div>
        </>
      )}
      {draft.method === "paypal" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: 16,
            background: "var(--surface2)",
            border: "1px solid var(--border-soft)",
            borderRadius: 10,
            fontSize: 12.5,
            color: "var(--text-dim)",
          }}
        >
          You&apos;ll be redirected to PayPal to link your account after this step.
        </div>
      )}
      {draft.method === "applepay" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: 16,
            background: "var(--surface2)",
            border: "1px solid var(--border-soft)",
            borderRadius: 10,
            fontSize: 12.5,
            color: "var(--text-dim)",
          }}
        >
          Confirm with Face ID / Touch ID to link Apple Pay after this step.
        </div>
      )}
    </div>
  );
}
