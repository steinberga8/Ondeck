"use client";

import { CheckIcon } from "@/components/icons";
import type { PipelineStage } from "@/lib/app-types";

export function Timeline({ stage, stages }: { stage: string; stages: PipelineStage[] }) {
  const curIdx = stages.findIndex((s) => s.key === stage);

  return (
    <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 26, background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 12, padding: "18px 16px" }}>
      {stages.map((st, i) => {
        const isDone = i < curIdx;
        const isCurrent = i === curIdx;
        const dotColor = isDone ? "var(--green)" : isCurrent ? st.color : "var(--surface3)";
        const labelColor = isCurrent ? st.color : isDone ? "var(--text-dim)" : "var(--text-faint)";
        const lineLeft = i === 0 ? "transparent" : i - 1 < curIdx ? "var(--green)" : "var(--border)";
        const lineRight = i === stages.length - 1 ? "transparent" : i < curIdx ? "var(--green)" : "var(--border)";
        return (
          <div key={st.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
            <div style={{ width: "100%", display: "flex", alignItems: "center" }}>
              <div style={{ flex: 1, height: 2, background: lineLeft }} />
              <div style={{ width: 22, height: 22, borderRadius: "50%", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", background: dotColor, border: `2px solid ${isCurrent ? st.color : "transparent"}` }}>
                {isDone && <CheckIcon size={11} color="var(--on-accent)" strokeWidth={3} />}
              </div>
              <div style={{ flex: 1, height: 2, background: lineRight }} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, marginTop: 9, textAlign: "center", color: labelColor }}>{st.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>{isDone ? "done" : isCurrent ? "current" : "—"}</div>
          </div>
        );
      })}
    </div>
  );
}
