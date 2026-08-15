"use client";

import { useState } from "react";
import { atsBreakdown, atsKeywordSplit } from "@/lib/app-logic";
import type { DecoratedApp } from "@/lib/app-logic";

export function AtsCard({ app }: { app: DecoratedApp }) {
  const [open, setOpen] = useState(false);

  if (!app.hasDesc || app.atsScoreVal === null) {
    return (
      <div style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 12, padding: "16px 18px" }}>
        <CardTitle />
        <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 }}>No job description on this application — add one to score your CV against it.</div>
      </div>
    );
  }

  const score = app.atsScoreVal;
  const { matched, missing } = atsKeywordSplit(app, app.jdKeywords);
  const breakdown = atsBreakdown(app);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 12, padding: "16px 18px" }}>
      <CardTitle />
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 28, fontWeight: 600, color: app.atsColor }}>{score}</span>
        <span style={{ fontSize: 11, color: "var(--text-faint)" }}>/ 100 keyword match with {app.cvVersionLabel}</span>
      </div>
      <div style={{ height: 7, background: "var(--surface2)", borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
        <div style={{ height: "100%", borderRadius: 4, background: app.atsColor, width: `${score}%` }} />
      </div>

      {matched.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", marginBottom: 5 }}>FOUND IN CV</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
            {matched.map((kw) => (
              <span key={kw} style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "var(--green)", background: "var(--green-soft)", padding: "3px 8px", borderRadius: 12 }}>
                {kw}
              </span>
            ))}
          </div>
        </>
      )}
      {missing.length > 0 && (
        <>
          <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", marginBottom: 5 }}>MISSING — ADD TO CV</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {missing.map((kw) => (
              <span key={kw} style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", color: "oklch(0.68 0.19 25)", background: "oklch(0.62 0.19 25 / 0.13)", padding: "3px 8px", borderRadius: 12 }}>
                {kw}
              </span>
            ))}
          </div>
        </>
      )}

      <div onClick={() => setOpen((o) => !o)} style={{ marginTop: 13, paddingTop: 12, borderTop: "1px solid var(--border-soft)", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--accent)" }}>{open ? "Hide full breakdown" : "Show full ATS breakdown"}</span>
      </div>

      {open && breakdown && (
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", letterSpacing: "0.05em", marginBottom: 9 }}>SCORE BREAKDOWN — HOW AN ATS ACTUALLY READS THIS</div>
            {breakdown.categories.map((cat) => (
              <div key={cat.label} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 4 }}>
                  <span style={{ fontWeight: 700 }}>{cat.label}</span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: cat.color }}>{cat.score}</span>
                </div>
                <div style={{ height: 6, background: "var(--surface2)", borderRadius: 3, overflow: "hidden", marginBottom: 5 }}>
                  <div style={{ height: "100%", borderRadius: 3, background: cat.color, width: `${cat.score}%` }} />
                </div>
                <div style={{ fontSize: 10.5, color: "var(--text-faint)", lineHeight: 1.45 }}>{cat.note}</div>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", letterSpacing: "0.05em", marginBottom: 9 }}>WHAT AN HR SCREEN WOULD NOTICE</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {breakdown.hrNotes.map((note, i) => (
                <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ flex: "none", width: 4, height: 4, borderRadius: "50%", background: "var(--text-faint)", marginTop: 6 }} />
                  <span style={{ fontSize: 11.5, color: "var(--text-dim)", lineHeight: 1.5 }}>{note}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", letterSpacing: "0.05em", marginBottom: 9 }}>GRAMMAR &amp; WORDING FLAGS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {breakdown.grammarIssues.map((g, i) => (
                <div key={i} style={{ background: "var(--surface2)", border: "1px solid var(--border-soft)", borderRadius: 9, padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 9, fontWeight: 800, fontFamily: "var(--font-mono)", color: "oklch(0.68 0.19 25)", letterSpacing: "0.04em" }}>{g.issue}</div>
                  <div style={{ fontSize: 11.5, lineHeight: 1.45, color: "var(--text-faint)", textDecoration: "line-through", textDecorationColor: "oklch(0.62 0.19 25 / 0.55)" }}>{g.weak}</div>
                  <div style={{ fontSize: 11.5, lineHeight: 1.45, color: "var(--text)" }}>{g.strong}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CardTitle() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 800 }}>ATS Match</div>
      <span style={{ fontSize: 8.5, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--accent)", background: "var(--accent-soft)", padding: "2px 5px", borderRadius: 4, letterSpacing: "0.05em" }}>BETA</span>
    </div>
  );
}
