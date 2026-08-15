"use client";

import { useEffect, useState } from "react";
import { Toggle } from "@/components/app/ui";
import { atsBreakdown, atsColor, atsScore, type AtsApplication } from "@/lib/ats";

type Application = AtsApplication & { id: string };

export function AtsBreakdown() {
  const [apps, setApps] = useState<Application[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [on, setOn] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((data) => setApps(data.applications ?? []))
      .catch(() => setError("Couldn’t load your applications."));
  }, []);

  const scored = (apps ?? []).filter((a) => !!a.desc);

  return (
    <div style={{ padding: "22px 28px 50px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 22 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 400 }}>ATS Breakdown</div>
            <span style={{ fontSize: 8.5, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--accent)", background: "var(--accent-soft)", padding: "2px 5px", borderRadius: 4, letterSpacing: "0.05em" }}>BETA</span>
          </div>
          <div style={{ fontSize: 12.5, color: "var(--text-faint)" }}>How an ATS parser and a recruiter skim would each read your CV against every job description on file.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: "none", padding: "9px 12px", background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 10 }}>
          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--text-dim)" }}>ATS Match</span>
          <Toggle on={on} onClick={() => setOn((v) => !v)} />
        </div>
      </div>

      {!on && (
        <div style={{ padding: "40px 20px", textAlign: "center", background: "var(--surface)", border: "1px dashed var(--border)", borderRadius: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>ATS Match is off</div>
          <div style={{ fontSize: 12, color: "var(--text-faint)" }}>Turn it on to see score breakdowns for every application with a job description on file.</div>
        </div>
      )}

      {on && error && <div style={{ padding: "40px 0", textAlign: "center", fontSize: 12.5, color: "var(--text-faint)" }}>{error}</div>}

      {on && !error && apps === null && <div style={{ padding: "40px 0", textAlign: "center", fontSize: 12.5, color: "var(--text-faint)" }}>Loading…</div>}

      {on && !error && apps !== null && scored.length === 0 && (
        <div style={{ padding: "40px 0", textAlign: "center", fontSize: 12.5, color: "var(--text-faint)" }}>
          No scored applications yet — add a job description to an application to get a full ATS breakdown.
        </div>
      )}

      {on && !error && scored.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {scored.map((app) => {
            const score = atsScore(app)!;
            const color = atsColor(score);
            const open = openId === app.id;
            const breakdown = open ? atsBreakdown(app) : null;
            return (
              <div key={app.id} style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 12, padding: "16px 18px" }}>
                <div onClick={() => setOpenId(open ? null : app.id)} style={{ display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 600, color, flex: "none", width: 46 }}>{score}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700 }}>
                      {app.company} <span style={{ fontWeight: 500, color: "var(--text-faint)" }}>· {app.role}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>vs {app.cvVersion || "no CV attached"}</div>
                  </div>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--accent)", flex: "none" }}>{open ? "Hide" : "Details"}</span>
                </div>

                {open && breakdown && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border-soft)", display: "flex", flexDirection: "column", gap: 16 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", letterSpacing: "0.05em", marginBottom: 9 }}>SCORE BREAKDOWN — HOW AN ATS ACTUALLY READS THIS</div>
                      {breakdown.categories.map((cat) => {
                        const catColor = atsColor(cat.score);
                        return (
                          <div key={cat.label} style={{ marginBottom: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, marginBottom: 4 }}>
                              <span style={{ fontWeight: 700 }}>{cat.label}</span>
                              <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600, color: catColor }}>{cat.score}</span>
                            </div>
                            <div style={{ height: 6, background: "var(--surface2)", borderRadius: 3, overflow: "hidden", marginBottom: 5 }}>
                              <div style={{ height: "100%", borderRadius: 3, background: catColor, width: `${cat.score}%` }} />
                            </div>
                            <div style={{ fontSize: 10.5, color: "var(--text-faint)", lineHeight: 1.45 }}>{cat.note}</div>
                          </div>
                        );
                      })}
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
          })}
        </div>
      )}
    </div>
  );
}
