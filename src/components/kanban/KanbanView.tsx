"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PlusIcon, StatsBarsIcon } from "@/components/icons";
import { NewApplicationModal } from "@/components/kanban/NewApplicationModal";
import { StageModal } from "@/components/kanban/StageModal";
import { StageStatsModal } from "@/components/kanban/StageStatsModal";
import { KanbanCard } from "@/components/kanban/KanbanCard";
import { computeStatCards, decorateApp } from "@/lib/app-logic";
import { useAppData, type InitialAppData } from "@/lib/useAppData";

export function KanbanView({ initial }: { initial: InitialAppData }) {
  const { apps, stages, loading, error, createApp, patchApp, deleteApp, createStage } = useAppData(initial);
  const [search, setSearch] = useState("");
  const [newAppOpen, setNewAppOpen] = useState(false);
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [statsKey, setStatsKey] = useState<string | null>(null);

  const stageMap = useMemo(() => new Map((stages ?? []).map((s) => [s.key, s])), [stages]);
  const filtered = useMemo(() => {
    if (!apps) return [];
    const q = search.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter((a) => a.company.toLowerCase().includes(q) || a.role.toLowerCase().includes(q));
  }, [apps, search]);

  const decorated = useMemo(() => filtered.map((a) => decorateApp(a, stageMap)), [filtered, stageMap]);
  const statCards = useMemo(() => computeStatCards(apps ?? []), [apps]);

  if (loading || !apps || !stages) {
    return <div style={{ padding: 40, color: "var(--text-dim)", fontSize: 13 }}>Loading your pipeline…</div>;
  }
  if (error) {
    return <div style={{ padding: 40, color: "oklch(0.68 0.19 25)", fontSize: 13 }}>{error}</div>;
  }

  const statsStage = statsKey ? stages.find((s) => s.key === statsKey) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* STAT STRIP + ACTIONS */}
      <div style={{ display: "flex", gap: 12, padding: "18px 24px 0", flex: "none", alignItems: "stretch", flexWrap: "wrap" }}>
        {statCards.map((stat) => (
          <div key={stat.label} style={{ flex: 1, minWidth: 140, background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 11, padding: "12px 16px", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
            <div style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600 }}>{stat.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 19, fontWeight: 600, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
        <Link
          href="/app/analytics"
          style={{ flex: "none", display: "flex", alignItems: "center", gap: 6, padding: "0 16px", background: "var(--accent-soft)", border: "1px solid var(--border-soft)", borderRadius: 11, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "var(--accent)", textDecoration: "none" }}
        >
          Full analytics
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M9 5L16 12L9 19" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div
          onClick={() => setNewAppOpen(true)}
          style={{ flex: "none", display: "flex", alignItems: "center", gap: 6, padding: "0 16px", background: "var(--accent)", color: "var(--on-accent)", borderRadius: 11, cursor: "pointer", fontSize: 12, fontWeight: 700 }}
        >
          <PlusIcon size={13} />
          Add Application
        </div>
        <div
          onClick={() => setStageModalOpen(true)}
          style={{
            flex: "none",
            display: "flex",
            alignItems: "center",
            gap: 7,
            padding: "0 16px",
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

      {/* SEARCH */}
      <div style={{ padding: "14px 24px 0", flex: "none" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search company or role…"
          style={{ width: 280, maxWidth: "100%", background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 8, padding: "8px 12px", color: "var(--text)", fontFamily: "var(--font-ui)", fontSize: 12.5, outline: "none" }}
        />
      </div>

      {apps.length === 0 && (
        <div style={{ margin: "16px 24px 0", display: "flex", alignItems: "center", gap: 14, padding: "16px 20px", background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: 12, flex: "none" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>Your pipeline is empty</div>
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Add your first application — every stat on this page will build itself from your real activity.</div>
          </div>
          <div onClick={() => setNewAppOpen(true)} style={{ padding: "8px 14px", background: "var(--accent)", color: "var(--on-accent)", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", flex: "none" }}>
            New Application
          </div>
        </div>
      )}

      {/* COLUMNS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16, padding: "16px 24px 24px", flex: 1, minHeight: 0, alignItems: "start", overflowY: "auto" }}>
        {stages.map((st) => {
          const colApps = decorated.filter((a) => a.stage === st.key);
          return (
            <div
              key={st.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("text/plain");
                if (id) patchApp(id, { stage: st.key });
              }}
              style={{ display: "flex", flexDirection: "column", minWidth: 0, background: "var(--surface)", borderRadius: 13, border: "1px solid var(--border-soft)", maxHeight: 560 }}
            >
              <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid var(--border-soft)", flex: "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <div style={{ width: 9, height: 9, borderRadius: "50%", background: st.color, flex: "none" }} />
                  <div style={{ fontSize: 13.5, fontWeight: 700, flex: 1 }}>{st.label}</div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setStatsKey(st.key);
                    }}
                    title="Step analytics"
                    style={{ width: 22, height: 22, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "var(--surface2)", flex: "none" }}
                  >
                    <StatsBarsIcon />
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)", background: "var(--surface2)", padding: "2px 8px", borderRadius: 20 }}>{colApps.length}</div>
                </div>
                {st.desc && <div style={{ fontSize: 10.5, color: "var(--text-faint)", marginTop: 4, paddingLeft: 18 }}>{st.desc}</div>}
              </div>
              <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8, overflowY: "auto" }}>
                {colApps.map((app) => (
                  <KanbanCard
                    key={app.id}
                    app={app}
                    stages={stages}
                    onStageChange={(stage) => patchApp(app.id, { stage })}
                    onReject={() => patchApp(app.id, app.rejected ? { rejected: false } : { rejected: true, rejectedAt: app.stage })}
                    onRejectedAtChange={(key) => patchApp(app.id, { rejectedAt: key })}
                    onDelete={() => {
                      if (confirm(`Delete the application to ${app.company}? This can't be undone.`)) deleteApp(app.id);
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {newAppOpen && <NewApplicationModal onClose={() => setNewAppOpen(false)} onCreate={createApp} />}
      {stageModalOpen && <StageModal stages={stages} onClose={() => setStageModalOpen(false)} onCreate={createStage} />}
      {statsStage && <StageStatsModal stage={statsStage} stages={stages} apps={apps} onClose={() => setStatsKey(null)} />}
    </div>
  );
}
