"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { PlusIcon, RejectIcon, TrashIcon } from "@/components/icons";
import { NewApplicationModal } from "@/components/kanban/NewApplicationModal";
import { StageModal } from "@/components/kanban/StageModal";
import { decorateApp } from "@/lib/app-logic";
import { useAppData, type InitialAppData } from "@/lib/useAppData";

export function TableView({ initial }: { initial: InitialAppData }) {
  const router = useRouter();
  const { apps, stages, loading, error, createApp, patchApp, deleteApp, createStage } = useAppData(initial);
  const [search, setSearch] = useState("");
  const [newAppOpen, setNewAppOpen] = useState(false);
  const [stageModalOpen, setStageModalOpen] = useState(false);

  const stageMap = useMemo(() => new Map((stages ?? []).map((s) => [s.key, s])), [stages]);

  const rows = useMemo(() => {
    if (!apps) return [];
    const q = search.trim().toLowerCase();
    const filtered = q ? apps.filter((a) => a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)) : apps;
    return filtered
      .slice()
      .sort((a, b) => new Date(b.appliedDate).getTime() - new Date(a.appliedDate).getTime())
      .map((a) => decorateApp(a, stageMap));
  }, [apps, search, stageMap]);

  if (loading || !apps || !stages) {
    return <div style={{ padding: 40, color: "var(--text-dim)", fontSize: 13 }}>Loading applications…</div>;
  }
  if (error) {
    return <div style={{ padding: 40, color: "oklch(0.68 0.19 25)", fontSize: 13 }}>{error}</div>;
  }

  const cols = "2fr 1.7fr 1.4fr 1.1fr 1fr 1.1fr 1.2fr 58px";

  return (
    <div style={{ padding: "22px 28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search company or role…"
          style={{ width: 280, maxWidth: "100%", background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 8, padding: "8px 12px", color: "var(--text)", fontFamily: "var(--font-ui)", fontSize: 12.5, outline: "none" }}
        />
        <div style={{ display: "flex", gap: 10 }}>
          <div onClick={() => setNewAppOpen(true)} style={{ display: "flex", alignItems: "center", gap: 7, padding: "8px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, background: "var(--accent)", color: "var(--on-accent)" }}>
            <PlusIcon size={13} />
            Add Application
          </div>
          <div
            onClick={() => setStageModalOpen(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "8px 14px",
              borderRadius: 8,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text)",
              background: "linear-gradient(135deg, oklch(0.7 0.2 250 / 0.36), oklch(0.3 0.05 250 / 0.32), oklch(1 0 0 / 0.3))",
              backdropFilter: "blur(8px)",
              border: "1px solid oklch(1 0 0 / 0.25)",
            }}
          >
            <PlusIcon size={13} />
            Add step
          </div>
        </div>
      </div>

      <div style={{ border: "1px solid var(--border)", borderRadius: 12, overflow: "hidden", background: "var(--surface)" }}>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 760 }}>
            <div style={{ display: "grid", gridTemplateColumns: cols, padding: "10px 18px", borderBottom: "1px solid var(--border)", background: "var(--surface2)" }}>
              {["Company / Role", "Stage", "Source", "CV", "Applied", "Next Step", "Days In Stage", ""].map((h) => (
                <div key={h} style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {h}
                </div>
              ))}
            </div>

            {rows.length === 0 && (
              <div style={{ padding: "34px 18px", textAlign: "center" }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>No applications yet</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Use the New Application button above to start tracking.</div>
              </div>
            )}

            {rows.map((app) => (
              <div
                key={app.id}
                onClick={() => router.push(`/app/applications/${app.id}`)}
                style={{ display: "grid", gridTemplateColumns: cols, alignItems: "center", padding: "12px 18px", borderBottom: "1px solid var(--border-soft)", cursor: "pointer" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <div style={{ width: 24, height: 24, borderRadius: 6, background: "var(--surface3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, color: "var(--text-dim)", flex: "none" }}>
                    {app.logoInitial}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 12.5, fontWeight: 700 }}>{app.company}</span>
                      {app.rejected && <span style={{ fontSize: 9.5, fontWeight: 700, color: "oklch(0.62 0.19 25)", background: "oklch(0.62 0.19 25 / 0.14)", padding: "2px 7px", borderRadius: 6 }}>Rejected</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{app.role}</div>
                  </div>
                </div>
                <div>
                  <select
                    value={app.stage}
                    onChange={(e) => patchApp(app.id, { stage: e.target.value })}
                    onClick={(e) => e.stopPropagation()}
                    style={{ background: app.stageBg, color: app.stageColor, border: "none", borderRadius: 20, fontFamily: "var(--font-ui)", fontSize: 11, fontWeight: 700, padding: "5px 8px", cursor: "pointer", outline: "none" }}
                  >
                    {stages.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ fontSize: 12, color: "var(--text-dim)" }}>{app.source}</div>
                <div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-dim)" }}>{app.cvVersionLabel}</div>
                  {app.hasAts && <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 600, color: app.atsColor }}>{app.atsLabel}</div>}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-dim)" }}>{app.appliedDateShort}</div>
                <div style={{ fontSize: 12, color: "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{app.nextStep}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, color: "var(--text-faint)" }}>{app.daysInStage}d</div>
                <div style={{ display: "flex", gap: 4 }}>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      patchApp(app.id, app.rejected ? { rejected: false } : { rejected: true, rejectedAt: app.stage });
                    }}
                    title={app.rejectBtnLabel}
                    style={{ width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: 0.55 }}
                  >
                    <RejectIcon size={12} color="oklch(0.62 0.19 25)" />
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete the application to ${app.company}? This can't be undone.`)) deleteApp(app.id);
                    }}
                    style={{ width: 24, height: 24, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: 0.55 }}
                  >
                    <TrashIcon size={11} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {newAppOpen && <NewApplicationModal onClose={() => setNewAppOpen(false)} onCreate={createApp} />}
      {stageModalOpen && <StageModal stages={stages} onClose={() => setStageModalOpen(false)} onCreate={createStage} />}
    </div>
  );
}
