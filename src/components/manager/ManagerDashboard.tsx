"use client";

import { useMemo, useState } from "react";

/**
 * All numbers on this page are static/deterministic mock data ported from the
 * design prototype's `renderVals()` — there is no real cross-tenant analytics
 * or billing pipeline behind Ondeck yet (that's a separate, out-of-scope
 * handoff), so this dashboard is illustrative rather than live.
 */

const MANAGER_FEATURES = [
  { name: "Kanban board", pct: 92, color: "var(--accent)" },
  { name: "Table view", pct: 61, color: "var(--accent)" },
  { name: "ATS Match (beta)", pct: 47, color: "var(--amber)" },
  { name: "CV Builder bot", pct: 38, color: "var(--accent)" },
  { name: "Analytics dashboard", pct: 55, color: "var(--accent)" },
  { name: "Mock screening agent", pct: 24, color: "var(--amber)" },
];

const MANAGER_SOURCES = [
  { name: "Direct / organic", pct: 34, glyph: "⍁", bg: "var(--surface3)", fg: "var(--text-dim)" },
  { name: "LinkedIn", pct: 27, glyph: "in", bg: "oklch(0.55 0.12 250)", fg: "white" },
  { name: "Google search", pct: 19, glyph: "G", bg: "oklch(0.7 0.15 250)", fg: "white" },
  { name: "Referral", pct: 12, glyph: "★", bg: "var(--green-soft)", fg: "var(--green)" },
  { name: "Twitter / X", pct: 8, glyph: "𝕏", bg: "var(--surface3)", fg: "var(--text-dim)" },
];

const MANAGER_FUNNEL = [
  { label: "Visited signup", value: 100 },
  { label: "Started step 1", value: 78 },
  { label: "Completed onboarding", value: 52 },
  { label: "Added 1st application", value: 41 },
  { label: "Active after 7 days", value: 26 },
];

type Range = "week" | "month" | "quarter";

const RANGE_DATA: Record<Range, { newUsers: string; newUsersDelta: string; payingCount: number; totalUsers: number }> = {
  week: { newUsers: "38", newUsersDelta: "+9% vs last week", payingCount: 112, totalUsers: 512 },
  month: { newUsers: "164", newUsersDelta: "+14% vs last month", payingCount: 112, totalUsers: 512 },
  quarter: { newUsers: "512", newUsersDelta: "+22% vs last quarter", payingCount: 112, totalUsers: 512 },
};

const RANGE_LABEL: Record<Range, string> = { week: "week", month: "month", quarter: "quarter" };

function StatTile({ icon, iconBg, label, value, valueColor, sub, subColor, gradient }: { icon: React.ReactNode; iconBg: string; label: string; value: string; valueColor?: string; sub: string; subColor?: string; gradient?: boolean }) {
  return (
    <div
      style={{
        background: gradient ? "linear-gradient(160deg, var(--accent-soft), var(--surface))" : "var(--surface)",
        border: gradient ? "1px solid oklch(0.72 0.14 195 / 0.3)" : "1px solid var(--border-soft)",
        borderRadius: 12,
        padding: "20px 22px",
        boxShadow: "0 1px 2px oklch(0 0 0 / 0.1)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: iconBg, display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>{icon}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</div>
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 36, lineHeight: 1, color: valueColor }}>{value}</div>
      <div style={{ fontSize: 11.5, color: subColor ?? "var(--text-faint)", marginTop: 9, fontWeight: subColor ? 600 : 400 }}>{sub}</div>
    </div>
  );
}

export function ManagerDashboard() {
  const [range, setRange] = useState<Range>("month");
  const r = RANGE_DATA[range];
  const payingPct = Math.round((r.payingCount / r.totalUsers) * 100);

  const rangeOptions = useMemo(() => (["week", "month", "quarter"] as Range[]).map((key) => ({ key, label: key[0].toUpperCase() + key.slice(1) })), []);

  return (
    <div style={{ padding: "30px 32px 52px", display: "flex", flexDirection: "column", gap: 26, maxWidth: 1320, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 26, marginBottom: 3 }}>Business overview</div>
          <div style={{ fontSize: 12.5, color: "var(--text-faint)" }}>
            Product usage, growth and revenue across all Ondeck accounts <span style={{ fontStyle: "italic" }}>(illustrative — no live billing pipeline yet)</span>
          </div>
        </div>
        <div style={{ display: "inline-flex", gap: 2, background: "var(--surface2)", border: "1px solid var(--border-soft)", borderRadius: 9, padding: 3 }}>
          {rangeOptions.map((opt) => (
            <div
              key={opt.key}
              onClick={() => setRange(opt.key)}
              style={{
                padding: "6px 14px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background: range === opt.key ? "var(--accent)" : "transparent",
                color: range === opt.key ? "var(--on-accent)" : "var(--text-faint)",
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <StatTile
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M17 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-4A3.5 3.5 0 0 0 6 18.5V20M12 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z" stroke="var(--accent)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          iconBg="var(--accent-soft)"
          label="New users"
          value={r.newUsers}
          sub={r.newUsersDelta}
          subColor="var(--green)"
        />
        <StatTile
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="var(--green)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          iconBg="var(--green-soft)"
          label="Paying / all users"
          value={`${payingPct}%`}
          sub={`${r.payingCount} of ${r.totalUsers} total users`}
        />
        <StatTile
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2L2 21h20L12 2z" stroke="var(--red)" strokeWidth="1.6" strokeLinejoin="round" /><line x1="12" y1="9" x2="12" y2="14" stroke="var(--red)" strokeWidth="1.7" strokeLinecap="round" /><circle cx="12" cy="17.3" r="0.9" fill="var(--red)" /></svg>}
          iconBg="var(--red-soft)"
          label="Bounce rate"
          value="31%"
          sub="−3pt vs previous period"
          subColor="var(--red)"
        />
        <StatTile
          icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="var(--on-accent)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>}
          iconBg="var(--accent)"
          label="Total earnings"
          value="$2,340"
          sub="$5/mo · 468 active subscriptions"
          gradient
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 12, padding: "22px 24px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 18 }}>
            Feature usage — % of active users this {RANGE_LABEL[range]}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {MANAGER_FEATURES.map((f) => (
              <div key={f.name}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 6 }}>
                  <span style={{ color: "var(--text-dim)", fontWeight: 600 }}>{f.name}</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-faint)" }}>{f.pct}%</span>
                </div>
                <div style={{ height: 7, borderRadius: 4, background: "var(--surface2)", overflow: "hidden" }}>
                  <div style={{ height: "100%", borderRadius: 4, background: f.color, width: `${f.pct}%`, transition: "width 0.4s ease" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 12, padding: "22px 24px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 18 }}>Where users come from</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
            {MANAGER_SOURCES.map((src) => (
              <div key={src.name} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: src.bg, display: "flex", alignItems: "center", justifyContent: "center", flex: "none", fontSize: 12, fontWeight: 800, color: src.fg }}>{src.glyph}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 600 }}>{src.name}</div>
                  <div style={{ height: 4, borderRadius: 2, background: "var(--surface2)", overflow: "hidden", marginTop: 5, width: "100%" }}>
                    <div style={{ height: "100%", borderRadius: 2, background: "var(--accent)", opacity: 0.55, width: `${src.pct}%` }} />
                  </div>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700 }}>{src.pct}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 16 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 12, padding: "22px 24px" }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 20 }}>Signup funnel</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 16, height: 150 }}>
            {MANAGER_FUNNEL.map((step) => (
              <div key={step.label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", gap: 8 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 700 }}>{step.value}%</div>
                <div
                  style={{
                    width: "100%",
                    height: `${step.value}%`,
                    borderRadius: "6px 6px 0 0",
                    background: "linear-gradient(180deg, var(--accent), oklch(0.72 0.14 195 / 0.55))",
                    boxShadow: "0 -1px 0 oklch(1 0 0 / 0.15) inset",
                  }}
                />
                <div style={{ fontSize: 10.5, color: "var(--text-faint)", textAlign: "center", lineHeight: 1.3 }}>{step.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "linear-gradient(160deg, var(--accent-soft), var(--surface))", border: "1px solid oklch(0.72 0.14 195 / 0.3)", borderRadius: 12, padding: "22px 24px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 8 }}>Total earnings</div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 32, marginBottom: 16 }}>$2,340</div>
            <div
              style={{
                background: "linear-gradient(135deg, oklch(0.72 0.14 195 / 0.5), oklch(0.4 0.04 195 / 0.4), oklch(1 0 0 / 0.25))",
                backdropFilter: "blur(8px)",
                border: "1px solid oklch(1 0 0 / 0.25)",
                color: "var(--text)",
                textAlign: "center",
                fontWeight: 700,
                fontSize: 12.5,
                padding: 12,
                borderRadius: 9,
                cursor: "default",
                opacity: 0.7,
              }}
              title="Mock only — no real payouts pipeline"
            >
              Withdraw to PayPal
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
