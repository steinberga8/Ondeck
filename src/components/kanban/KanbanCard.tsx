"use client";

import { useRouter } from "next/navigation";
import { CloseIcon, ClockIcon, RejectIcon } from "@/components/icons";
import type { DecoratedApp } from "@/lib/app-logic";
import type { PipelineStage } from "@/lib/app-types";
import { CvChip } from "@/components/files/FileParts";

export function KanbanCard({
  app,
  stages,
  onStageChange,
  onReject,
  onRejectedAtChange,
  onDelete,
  onAttachCv,
}: {
  app: DecoratedApp;
  stages: PipelineStage[];
  onStageChange: (stage: string) => void;
  onReject: () => void;
  onRejectedAtChange: (key: string) => void;
  onDelete: () => void;
  onAttachCv: () => void;
}) {
  const router = useRouter();

  return (
    <div
      className="kanban-card"
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", app.id)}
      onClick={() => router.push(`/app/applications/${app.id}`)}
      style={{
        background: "var(--surface2)",
        border: "1px solid var(--border-soft)",
        borderLeft: `3px solid ${app.accentBar}`,
        borderRadius: 10,
        padding: "14px 15px",
        cursor: "grab",
        animation: "fadeUp 0.3s ease both",
        opacity: app.cardOpacity,
        transition: "transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease",
        boxShadow: "0 1px 2px oklch(0 0 0 / 0.12)",
        backdropFilter: "blur(12px) saturate(135%)",
        WebkitBackdropFilter: "blur(12px) saturate(135%)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 28, height: 28, borderRadius: 7, background: "var(--surface3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--text-dim)", flex: "none" }}>
          {app.logoInitial}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{app.company}</div>
          <div style={{ fontSize: 12, color: "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{app.role}</div>
        </div>
        <div
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{ width: 18, height: 18, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "none", opacity: 0.45 }}
        >
          <CloseIcon size={9} color="var(--text-dim)" />
        </div>
      </div>

      <CvChip app={app} onAttach={onAttachCv} />

      {app.rejected && (
        <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: "oklch(0.62 0.19 25)", background: "oklch(0.62 0.19 25 / 0.14)", padding: "3px 8px", borderRadius: 6, flex: "none" }}>Rejected at</span>
          <select
            value={app.rejectedAtKey}
            onChange={(e) => onRejectedAtChange(e.target.value)}
            style={{ background: "var(--surface3)", color: "var(--text-dim)", border: "1px solid var(--border-soft)", borderRadius: 6, fontFamily: "var(--font-ui)", fontSize: 10.5, fontWeight: 600, padding: "3px 5px", cursor: "pointer", outline: "none", minWidth: 0 }}
          >
            {stages.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)", whiteSpace: "nowrap" }}>
            {app.cvVersionLabel} · {app.appliedDateShort}
          </span>
          {app.hasAts && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 600, color: app.atsColor, border: `1px solid ${app.atsColor}`, padding: "2px 6px", borderRadius: 5, whiteSpace: "nowrap" }}>
              {app.atsLabel}
            </span>
          )}
        </div>
        <select
          value={app.stage}
          onChange={(e) => onStageChange(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          style={{ background: "var(--surface3)", color: "var(--text-dim)", border: "1px solid var(--border-soft)", borderRadius: 6, fontFamily: "var(--font-ui)", fontSize: 10, fontWeight: 600, padding: "3px 4px", cursor: "pointer", outline: "none", maxWidth: 110 }}
        >
          {stages.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {app.showDeadline && (
        <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 5, fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--amber)", background: "var(--amber-soft)", padding: "4px 8px", borderRadius: 6 }}>
          <ClockIcon size={10} />
          due {app.assignmentDue}
        </div>
      )}

      <div
        onClick={(e) => {
          e.stopPropagation();
          onReject();
        }}
        style={{
          marginTop: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: 6,
          borderRadius: 7,
          fontSize: 10.5,
          fontWeight: 700,
          cursor: "pointer",
          background: app.rejected ? "var(--surface3)" : "oklch(0.62 0.19 25 / 0.12)",
          color: app.rejected ? "var(--text-dim)" : "oklch(0.68 0.19 25)",
          border: app.rejected ? "1px solid var(--border-soft)" : "1px solid oklch(0.62 0.19 25 / 0.3)",
        }}
      >
        <RejectIcon size={10} />
        {app.rejectBtnLabel}
      </div>
    </div>
  );
}
