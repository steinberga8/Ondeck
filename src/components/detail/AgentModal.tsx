"use client";

import { useState } from "react";
import { AiIcon, CloseIcon } from "@/components/icons";
import { buildAgentQuestions } from "@/lib/app-logic";
import type { Application } from "@/lib/app-types";

export function AgentModal({ app, onClose }: { app: Application; onClose: () => void }) {
  const questions = buildAgentQuestions(app);
  const [index, setIndex] = useState(0);
  const hasMore = index < questions.length - 1;

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "oklch(0 0 0 / 0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: 560, maxWidth: "92%", maxHeight: "82vh", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, display: "flex", flexDirection: "column", animation: "modalIn 0.22s ease both", boxShadow: "0 30px 60px oklch(0 0 0 / 0.4)" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px", borderBottom: "1px solid var(--border-soft)", flex: "none" }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <AiIcon size={13} />
          </div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 800 }}>Mock Screening · {app.company}</div>
            <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{app.role}</div>
          </div>
          <div onClick={onClose} style={{ marginLeft: "auto", width: 26, height: 26, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "var(--surface2)" }}>
            <CloseIcon size={12} />
          </div>
        </div>

        <div style={{ padding: "12px 20px 6px", flex: "none" }}>
          <div style={{ fontSize: 10.5, color: "var(--text-faint)", fontWeight: 600, marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.04em" }}>Extracted from job description</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {app.jdKeywords.map((kw) => (
              <span key={kw} style={{ fontSize: 11, fontFamily: "var(--font-mono)", background: "var(--accent-soft)", color: "var(--accent)", padding: "4px 9px", borderRadius: 20 }}>
                {kw}
              </span>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          {questions.slice(0, index + 1).map((msg, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, background: "var(--accent)", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9.5, fontWeight: 800, color: "var(--on-accent)" }}>AI</div>
                <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 13px", fontSize: 12.5, lineHeight: 1.5, maxWidth: 420 }}>{msg.q}</div>
              </div>
              {i === index && (
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start", paddingLeft: 32 }}>
                  <div style={{ border: "1px dashed var(--border)", borderRadius: 10, padding: "9px 12px", fontSize: 11.5, color: "var(--text-faint)", fontStyle: "italic", maxWidth: 400 }}>tip: {msg.tip}</div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ padding: "14px 20px", borderTop: "1px solid var(--border-soft)", flex: "none" }}>
          {hasMore ? (
            <div onClick={() => setIndex((i) => i + 1)} style={{ textAlign: "center", background: "var(--accent)", color: "var(--on-accent)", fontWeight: 700, fontSize: 12.5, padding: 11, borderRadius: 9, cursor: "pointer" }}>
              Next Question
            </div>
          ) : (
            <div onClick={onClose} style={{ textAlign: "center", background: "var(--surface2)", border: "1px solid var(--border)", color: "var(--text)", fontWeight: 700, fontSize: 12.5, padding: 11, borderRadius: 9, cursor: "pointer" }}>
              End Practice Session
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
