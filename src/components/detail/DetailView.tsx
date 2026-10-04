"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AiIcon, BackArrowIcon, BriefcaseIcon, ExternalLinkIcon, RejectIcon, TrashIcon } from "@/components/icons";
import { AgentModal } from "@/components/detail/AgentModal";
import { AssignmentFiles } from "@/components/detail/AssignmentFiles";
import { AtsCard } from "@/components/detail/AtsCard";
import { CvBox } from "@/components/detail/CvBox";
import { StageLog } from "@/components/detail/StageLog";
import { Timeline } from "@/components/detail/Timeline";
import { decorateApp } from "@/lib/app-logic";
import { useAppData, type InitialAppData } from "@/lib/useAppData";

export function DetailView({ id, initial }: { id: string; initial: InitialAppData }) {
  const router = useRouter();
  const { apps, stages, loading, error, patchApp, deleteApp, pickAndAttachCv, attachEmailFile, attachEmailText, removeEmail, addAssignmentFile, removeAssignmentFile } = useAppData(initial);
  const [logKey, setLogKey] = useState("all");
  const [agentOpen, setAgentOpen] = useState(false);

  const stageMap = useMemo(() => new Map((stages ?? []).map((s) => [s.key, s])), [stages]);
  const raw = apps?.find((a) => a.id === id);
  const app = raw ? decorateApp(raw, stageMap) : null;

  if (loading || !apps || !stages) {
    return <div style={{ padding: 40, color: "var(--text-dim)", fontSize: 13 }}>Loading application…</div>;
  }
  if (error) {
    return <div style={{ padding: 40, color: "oklch(0.68 0.19 25)", fontSize: 13 }}>{error}</div>;
  }
  if (!app) {
    return (
      <div style={{ padding: 40 }}>
        <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 12 }}>This application doesn&apos;t exist, or was deleted.</div>
        <div onClick={() => router.push("/app")} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--accent)", cursor: "pointer", fontWeight: 700 }}>
          <BackArrowIcon size={13} /> Back to pipeline
        </div>
      </div>
    );
  }

  async function onDelete() {
    if (!confirm(`Delete the application to ${app!.company}? This can't be undone.`)) return;
    await deleteApp(app!.id);
    router.push("/app");
  }

  return (
    <div style={{ padding: "22px 28px 60px", maxWidth: 880 }}>
      <div onClick={() => router.back()} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-dim)", cursor: "pointer", marginBottom: 18 }}>
        <BackArrowIcon size={13} />
        Back
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
        <div style={{ width: 46, height: 46, borderRadius: 10, background: "var(--surface3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 700, color: "var(--text-dim)", flex: "none" }}>
          {app.logoInitial}
        </div>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 20, fontWeight: 800 }}>{app.company}</span>
            {app.rejected && <span style={{ fontSize: 10.5, fontWeight: 700, color: "oklch(0.62 0.19 25)", background: "oklch(0.62 0.19 25 / 0.14)", padding: "3px 9px", borderRadius: 6 }}>Rejected</span>}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-dim)" }}>
            {app.role} · via {app.source}
          </div>
        </div>
      </div>

      <Timeline stage={app.stage} stages={stages} onSelect={setLogKey} />

      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
          {(app.stage === "assignment" || app.hasAssignment) && (
            <div style={{ background: "var(--amber-soft)", border: "1px solid oklch(0.78 0.15 75 / 0.35)", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <BriefcaseIcon size={15} />
                <div style={{ fontSize: 13.5, fontWeight: 800, color: "var(--amber)" }}>Home Assignment</div>
                {app.showDeadline && (
                  <div style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--amber)", background: "oklch(0.78 0.15 75 / 0.2)", padding: "3px 8px", borderRadius: 6 }}>due {app.assignmentDue}</div>
                )}
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{app.assignmentTitle ?? "Home assignment"}</div>
              <div style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.5, marginBottom: 12 }}>{app.assignmentDesc ?? "Keep the brief they sent and your submission together here."}</div>
              <AssignmentFiles app={app} addAssignmentFile={addAssignmentFile} removeAssignmentFile={removeAssignmentFile} />
            </div>
          )}

          {app.hasDesc && (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 12, padding: "16px 18px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Job Description</div>
              <div style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{app.desc}</div>
            </div>
          )}

          <StageLog app={app} stages={stages} logKey={logKey} onLogKey={setLogKey} patchApp={patchApp} attachEmailFile={attachEmailFile} attachEmailText={attachEmailText} removeEmail={removeEmail} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
          <div style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 10 }}>Details</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                <span style={{ color: "var(--text-faint)" }}>Current Stage</span>
                <select
                  value={app.stage}
                  onChange={(e) => patchApp(app.id, { stage: e.target.value })}
                  style={{ background: app.stageBg, color: app.stageColor, border: "none", borderRadius: 20, fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 700, padding: "5px 8px", cursor: "pointer", outline: "none" }}
                >
                  {stages.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              <Row label="CV Version" value={app.cvVersionLabel} mono />
              <CvBox app={app} onReplace={() => pickAndAttachCv(app.id)} />
              <Row label="Source" value={app.source} />
              <Row label="Applied" value={app.appliedDateFull} mono />
              <Row label="Referral" value={app.referralLabel} bold />
              {app.hasLink && app.link && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12 }}>
                  <span style={{ color: "var(--text-faint)" }}>Job Link</span>
                  <a href={app.link} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--accent)", fontWeight: 700, textDecoration: "none", fontSize: 11.5 }}>
                    {app.linkSource}
                    <ExternalLinkIcon />
                  </a>
                </div>
              )}
            </div>

            {app.rejected && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, marginTop: 9 }}>
                <span style={{ color: "var(--text-faint)" }}>Rejected at</span>
                <select
                  value={app.rejectedAtKey}
                  onChange={(e) => patchApp(app.id, { rejectedAt: e.target.value })}
                  style={{ background: "oklch(0.62 0.19 25 / 0.14)", color: "oklch(0.68 0.19 25)", border: "none", borderRadius: 20, fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 700, padding: "5px 8px", cursor: "pointer", outline: "none" }}
                >
                  {stages.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div
              onClick={() => patchApp(app.id, app.rejected ? { rejected: false } : { rejected: true, rejectedAt: app.stage })}
              style={{ marginTop: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 8, background: "oklch(0.62 0.19 25 / 0.12)", border: "1px solid oklch(0.62 0.19 25 / 0.3)", borderRadius: 8, color: "oklch(0.62 0.19 25)", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
            >
              <RejectIcon size={12} />
              {app.rejectBtnLabel}
            </div>
            <div
              onClick={onDelete}
              style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: 8, border: "1px solid oklch(0.6 0.19 25 / 0.35)", borderRadius: 8, color: "oklch(0.62 0.19 25)", fontSize: 11.5, fontWeight: 700, cursor: "pointer" }}
            >
              <TrashIcon size={11} color="currentColor" />
              Delete application
            </div>
          </div>

          <AtsCard app={app} />

          <div style={{ background: "linear-gradient(160deg, var(--accent-soft), var(--surface))", border: "1px solid oklch(0.7 0.14 195 / 0.32)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
                <AiIcon size={12} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 800 }}>AI Screening Practice</div>
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5, marginBottom: 12 }}>Mock call built from this job&apos;s description. Practice before the real thing.</div>
            <div onClick={() => setAgentOpen(true)} style={{ textAlign: "center", background: "var(--accent)", color: "var(--on-accent)", fontWeight: 700, fontSize: 12.5, padding: 10, borderRadius: 8, cursor: "pointer" }}>
              Start Mock Screening
            </div>
          </div>
        </div>
      </div>

      {agentOpen && <AgentModal app={app} onClose={() => setAgentOpen(false)} />}
    </div>
  );
}

function Row({ label, value, mono, bold, small }: { label: string; value: string; mono?: boolean; bold?: boolean; small?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontSize: 12 }}>
      <span style={{ color: "var(--text-faint)", flex: "none" }}>{label}</span>
      <span
        style={{
          fontFamily: mono ? "var(--font-mono)" : undefined,
          fontWeight: bold ? 600 : undefined,
          fontSize: small ? 10.5 : undefined,
          color: small ? "var(--text-dim)" : undefined,
          minWidth: 0,
          whiteSpace: small ? "nowrap" : undefined,
          overflow: small ? "hidden" : undefined,
          textOverflow: small ? "ellipsis" : undefined,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}
