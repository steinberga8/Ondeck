"use client";

import { CloseIcon } from "@/components/icons";
import { daysInStage } from "@/lib/app-logic";
import type { Application, PipelineStage } from "@/lib/app-types";

export function StageStatsModal({ stage, stages, apps, onClose }: { stage: PipelineStage; stages: PipelineStage[]; apps: Application[]; onClose: () => void }) {
  const idx = stages.findIndex((s) => s.key === stage.key);
  const inStage = apps.filter((a) => a.stage === stage.key);
  const total = apps.length || 1;
  const reached = apps.filter((a) => stages.findIndex((s) => s.key === a.stage) >= idx).length;
  const isFinal = idx === stages.length - 1;
  const reachedNext = isFinal ? null : apps.filter((a) => stages.findIndex((s) => s.key === a.stage) > idx).length;
  const rejHere = apps.filter((a) => a.rejected && (a.rejectedAt || a.stage) === stage.key).length;
  const avgDays = inStage.length ? Math.round(inStage.reduce((sum, a) => sum + daysInStage(a), 0) / inStage.length) : null;

  const rows: { k: string; v: string }[] = [
    { k: "Currently in this step", v: String(inStage.length) },
    { k: "Reached this step", v: `${reached} of ${apps.length} (${Math.round((reached / total) * 100)}%)` },
    { k: "Advanced past it", v: reachedNext === null ? "— (final step)" : reached ? `${reachedNext} (${Math.round((reachedNext / Math.max(1, reached)) * 100)}%)` : "0" },
    { k: "Rejected at this step", v: String(rejHere) },
    { k: "Avg. days in step", v: avgDays === null ? "—" : `${avgDays}d` },
  ];

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "oklch(0 0 0 / 0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 460, maxHeight: "82vh", overflowY: "auto", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, animation: "modalIn 0.22s ease both", boxShadow: "0 30px 60px oklch(0 0 0 / 0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 22px", borderBottom: "1px solid var(--border-soft)" }}>
          <div style={{ width: 10, height: 10, borderRadius: "50%", background: stage.color, flex: "none" }} />
          <div style={{ fontSize: 15, fontWeight: 800, flex: 1 }}>{stage.label} — Step Analytics</div>
          <div onClick={onClose} style={{ width: 26, height: 26, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "var(--surface2)", flex: "none" }}>
            <CloseIcon size={12} />
          </div>
        </div>
        <div style={{ padding: "18px 22px", display: "flex", flexDirection: "column", gap: 10 }}>
          {rows.map((row) => (
            <div key={row.k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "var(--surface2)", border: "1px solid var(--border-soft)", borderRadius: 9 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--text-dim)" }}>{row.k}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600 }}>{row.v}</span>
            </div>
          ))}
          {inStage.length > 0 && (
            <>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 6 }}>Currently here</div>
              {inStage.map((a) => (
                <div key={a.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 14px", border: "1px solid var(--border-soft)", borderRadius: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700 }}>{a.company}</span>
                    <span style={{ fontSize: 11.5, color: "var(--text-dim)" }}> · {a.role}</span>
                  </div>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)", flex: "none" }}>{daysInStage(a)}d</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
