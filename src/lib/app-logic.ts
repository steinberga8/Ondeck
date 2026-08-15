// Pure, deterministic client-side logic ported from the DC prototype's `renderVals()`
// (see the handoff README / project spec — this is intentionally verbatim, not re-derived).
import type { Application, PipelineStage } from "./app-types";

export function fmtShort(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function fmtFull(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function linkSource(link: string | null): string | null {
  if (!link) return null;
  const l = link.toLowerCase();
  if (l.includes("linkedin")) return "LinkedIn";
  if (l.includes("glassdoor")) return "Glassdoor";
  return "Company site";
}

/** ATS-style score: deterministic keyword-match simulation, only when a real JD exists. */
export function atsScore(a: Pick<Application, "company" | "cvVersion" | "desc">): number | null {
  if (!a.desc) return null;
  let h = 0;
  const key = a.company + "|" + (a.cvVersion || "") + "|" + a.desc.length;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return 55 + (h % 41); // 55–95
}

export function atsColor(score: number): string {
  if (score >= 80) return "var(--green)";
  if (score >= 65) return "var(--amber)";
  return "oklch(0.68 0.19 25)";
}

function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

const ATS_GRAMMAR_BANK = [
  { weak: "Responsible for managing client relationships.", issue: "PASSIVE / DUTY-FOCUSED", strong: "Managed 40+ client relationships, retaining 95% year-over-year." },
  { weak: "Worked on improving team processes.", issue: "VAGUE VERB, NO OUTCOME", strong: "Redesigned onboarding process, cutting ramp time from 6 to 3 weeks." },
  { weak: "Helped with the launch of a new product.", issue: '"HELPED" UNDERSELLS OWNERSHIP', strong: "Led launch of a new product line, reaching 10K users in month one." },
  { weak: "Utilized various tools to complete tasks.", issue: '"UTILIZED / VARIOUS" ARE FILLER', strong: "Used Salesforce and Looker daily to track pipeline health." },
  { weak: "Good communication and team player.", issue: "UNVERIFIABLE SOFT-SKILL CLAIM", strong: "Presented weekly updates to a 12-person cross-functional team." },
];

export type AtsCategory = { label: string; score: number; note: string; color: string };
export type AtsBreakdown = {
  categories: AtsCategory[];
  hrNotes: string[];
  grammarIssues: { weak: string; issue: string; strong: string }[];
};

/** Deterministic mock breakdown of how an ATS + recruiter skim would read this CV against this JD. */
export function atsBreakdown(a: Pick<Application, "company" | "cvVersion" | "desc" | "role">): AtsBreakdown | null {
  const sc = atsScore(a);
  if (sc === null) return null;
  const h = hashStr(a.company + (a.desc || ""));
  const formatting = 78 + (h % 18);
  const grammar = 70 + ((h >> 3) % 26);
  const structure = 75 + ((h >> 5) % 20);
  const catColor = (score: number) => (score >= 80 ? "var(--green)" : score >= 65 ? "var(--amber)" : "oklch(0.68 0.19 25)");
  const categories: AtsCategory[] = [
    { label: "Keyword Match", score: sc, color: catColor(sc), note: sc >= 80 ? "Strong overlap with the JD’s core terms." : sc >= 65 ? "Decent overlap, but a few high-signal terms are missing." : "Low overlap — an ATS keyword filter may deprioritize this." },
    { label: "Formatting & Parsing", score: formatting, color: catColor(formatting), note: formatting >= 85 ? "Clean single-column layout — parses cleanly into fields." : "Mostly parses fine; watch for tables, icons or multi-column sections that ATS text-extractors can scramble." },
    { label: "Grammar & Tone", score: grammar, color: catColor(grammar), note: grammar >= 85 ? "Clear, active-voice bullets throughout." : "A few passive or vague phrasings a recruiter would skim past." },
    { label: "Structure & Sections", score: structure, color: catColor(structure), note: structure >= 85 ? "Standard section headers (Experience, Education, Skills) an ATS recognizes instantly." : 'Section headers are mostly standard — keep them literal, avoid creative labels like "My Journey".' },
  ];
  const hrNotes = [
    `First 6-second scan lands on your most recent title and company — make sure it echoes the "${a.role || "role"}" language they searched for.`,
    "Recruiters skim for a number in the first two bullets — lead with a metric, not a duty.",
    "Contact info and location get checked for logistics fit before anything else is read closely.",
  ];
  const issueCount = 2 + (h % 2);
  const grammarIssues = [];
  for (let i = 0; i < issueCount; i++) grammarIssues.push(ATS_GRAMMAR_BANK[(h + i) % ATS_GRAMMAR_BANK.length]);
  return { categories, hrNotes, grammarIssues };
}

/** Which JD keywords appear to be matched vs missing — a lightweight deterministic split. */
export function atsKeywordSplit(a: Pick<Application, "company" | "cvVersion" | "desc">, keywords: string[]) {
  const sc = atsScore(a);
  if (sc === null) return { matched: [] as string[], missing: [] as string[] };
  const matched = keywords.filter((_, i) => (sc + i) % 3 !== 0);
  const missing = keywords.filter((_, i) => (sc + i) % 3 === 0);
  return { matched, missing };
}

export type AgentQuestion = { q: string; tip: string };

/** UI-only mock screening-agent question set built from the JD keywords. Nothing persisted. */
export function buildAgentQuestions(app: Pick<Application, "company" | "jdKeywords">): AgentQuestion[] {
  const kws = app.jdKeywords || [];
  return [
    { q: `Walk me through a project where you used ${kws[0] || "your core stack"} to solve a hard problem.`, tip: `Structure with situation → approach → measurable outcome.` },
    { q: `This role leans on ${kws[1] || "strong fundamentals"} — how have you applied that recently?`, tip: `Reference a specific artifact you can show, not just a description.` },
    { q: `How would you approach ${kws[2] || "ambiguity"} in your first 90 days at ${app.company}?`, tip: `Anchor on learning fast, then shipping a small visible win.` },
    { q: `Why ${app.company} specifically, and why this role right now?`, tip: `Tie your answer to something concrete from their product or JD.` },
  ];
}

/**
 * Approximate "days in current stage". The API doesn't persist a per-stage transition
 * timestamp, so this uses days-since-applied as a reasonable stand-in (per the project spec).
 */
export function daysInStage(app: Pick<Application, "appliedDate">): number {
  const applied = new Date(app.appliedDate + "T00:00:00").getTime();
  return Math.max(0, Math.floor((Date.now() - applied) / 86400000));
}

// ---------------------------------------------------------------------------
// Aggregate stats — shared by the Kanban home strip and the Analytics page.
// Ported from renderVals(): funnel, CV response rate, time-per-stage,
// ATS-score-vs-response-rate, referral-vs-cold, rejection-by-stage, stat cards.
// ---------------------------------------------------------------------------

export type StatCard = { label: string; value: string; color: string };

export function computeStatCards(apps: Application[]): StatCard[] {
  const total = apps.length;
  const responded = apps.filter((a) => a.stage !== "applied").length;
  const offers = apps.filter((a) => a.stage === "contract");
  const avgTimeToOffer = offers.length
    ? Math.round(offers.reduce((sum, a) => sum + Math.max(1, (Date.now() - new Date(a.appliedDate + "T00:00:00").getTime()) / 86400000), 0) / offers.length) + "d"
    : "—";
  return [
    { label: "Active Applications", value: String(total), color: "var(--text)" },
    { label: "Response Rate", value: (total ? Math.round((responded / total) * 100) : 0) + "%", color: "var(--accent)" },
    { label: "Avg. Time to Offer", value: avgTimeToOffer, color: "var(--green)" },
    { label: "In Home Assignment", value: String(apps.filter((a) => a.stage === "assignment").length), color: "var(--amber)" },
  ];
}

export function computeFunnel(apps: Application[], stages: PipelineStage[]) {
  const total = apps.length;
  const stageIdx = (key: string) => stages.findIndex((s) => s.key === key);
  return stages.map((st, i) => {
    const count = apps.filter((a) => stageIdx(a.stage) >= i).length;
    return { label: st.label, color: st.color, count, pct: total ? Math.round((count / total) * 100) : 0 };
  });
}

const CV_PALETTE = ["var(--st-applied)", "var(--st-screening)", "var(--accent)", "var(--st-hr)", "var(--st-contract)"];

export function computeCvStats(apps: Application[]) {
  const groups = new Map<string, { count: number; responded: number }>();
  for (const a of apps) {
    if (!a.cvVersion || a.cvVersion === "—") continue;
    const g = groups.get(a.cvVersion) ?? { count: 0, responded: 0 };
    g.count++;
    if (a.stage !== "applied") g.responded++;
    groups.set(a.cvVersion, g);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([version, d], i) => {
      const rate = d.count ? Math.round((d.responded / d.count) * 100) : 0;
      return { version, count: d.count, responded: d.responded, rate, color: CV_PALETTE[i % CV_PALETTE.length], barHeight: Math.max(10, Math.round(rate * 1.2)) };
    });
}

export function computeTimeStats(apps: Application[], stages: PipelineStage[]) {
  const timeCounts = stages.map((st) => {
    const inStage = apps.filter((a) => a.stage === st.key);
    if (!inStage.length) return null;
    return Math.round(inStage.reduce((sum, a) => sum + daysInStage(a), 0) / inStage.length);
  });
  const timeMax = Math.max(1, ...timeCounts.filter((v): v is number => v !== null));
  return stages.map((st, i) => ({
    label: st.label,
    color: st.color,
    hasData: timeCounts[i] !== null,
    days: timeCounts[i] !== null ? timeCounts[i] + "d" : "—",
    pct: timeCounts[i] !== null ? Math.max(4, Math.round((timeCounts[i]! / timeMax) * 100)) : 0,
  }));
}

export function computeAtsBuckets(apps: Application[]) {
  const buckets = [
    { label: "80–100", min: 80, max: 100, color: "var(--green)" },
    { label: "65–79", min: 65, max: 79, color: "var(--amber)" },
    { label: "< 65", min: 0, max: 64, color: "oklch(0.68 0.19 25)" },
  ];
  return buckets.map((b) => {
    const inB = apps.filter((a) => {
      const sc = atsScore(a);
      return sc !== null && sc >= b.min && sc <= b.max;
    });
    const responded = inB.filter((a) => a.stage !== "applied").length;
    const rate = inB.length ? Math.round((responded / inB.length) * 100) : null;
    return {
      label: b.label,
      color: b.color,
      count: inB.length,
      hasData: inB.length > 0,
      rate: rate === null ? "—" : rate + "%",
      pct: rate === null ? 0 : Math.max(3, rate),
      detail: inB.length ? `${responded}/${inB.length} responded` : "no scored applications",
    };
  });
}

export function computeRefStats(apps: Application[], stages: PipelineStage[]) {
  const stageIdx = (key: string) => stages.findIndex((s) => s.key === key);
  const buckets = [
    { key: "referral", label: "Referral", color: "var(--green)", apps: apps.filter((a) => a.referral) },
    { key: "cold", label: "Cold apply", color: "var(--st-screening)", apps: apps.filter((a) => !a.referral) },
  ];
  return buckets.map((b) => {
    const total = b.apps.length;
    const responded = b.apps.filter((a) => a.stage !== "applied").length;
    const advanced = b.apps.filter((a) => stageIdx(a.stage) >= 2).length;
    const offers = b.apps.filter((a) => a.stage === "contract").length;
    const rate = total ? Math.round((responded / total) * 100) : 0;
    return {
      label: b.label,
      color: b.color,
      total,
      rate,
      respondedLabel: `${responded}/${total} responses`,
      advancedLabel: `${advanced} reached interviews`,
      offersLabel: `${offers} ${offers === 1 ? "offer" : "offers"}`,
      hasApps: total > 0,
    };
  });
}

export function computeRejStats(apps: Application[], stages: PipelineStage[]) {
  const rejected = apps.filter((a) => a.rejected);
  const counts = stages.map((st) => rejected.filter((a) => (a.rejectedAt || a.stage) === st.key).length);
  const max = Math.max(1, ...counts);
  return stages.map((st, i) => ({ label: st.label, count: counts[i], pct: Math.round((counts[i] / max) * 100) }));
}

export type DecoratedApp = Application & {
  stageLabel: string;
  stageColor: string;
  stageBg: string;
  accentBar: string;
  logoInitial: string;
  cardOpacity: string;
  rejectBtnLabel: string;
  appliedDateShort: string;
  appliedDateFull: string;
  showDeadline: boolean;
  hasAssignment: boolean;
  hasDesc: boolean;
  hasLink: boolean;
  linkSource: string | null;
  atsScoreVal: number | null;
  hasAts: boolean;
  atsLabel: string;
  atsColor: string;
  referralLabel: string;
  cvVersionLabel: string;
  daysInStage: number;
  rejectedAtKey: string;
};

/** Build the per-application decoration shared by kanban cards, table rows and the detail page. */
export function decorateApp(a: Application, stageMap: Map<string, PipelineStage>): DecoratedApp {
  const st = stageMap.get(a.stage);
  const score = atsScore(a);
  return {
    ...a,
    stageLabel: st?.label ?? a.stage,
    stageColor: st?.color ?? "var(--text-faint)",
    stageBg: a.rejected ? "oklch(0.62 0.19 25 / 0.14)" : st?.soft ?? "var(--surface2)",
    accentBar: a.rejected ? "oklch(0.62 0.19 25)" : st?.color ?? "var(--border)",
    logoInitial: a.company[0]?.toUpperCase() ?? "?",
    cardOpacity: a.rejected ? "0.55" : "1",
    rejectBtnLabel: a.rejected ? "Reinstate application" : "Mark as rejected",
    appliedDateShort: fmtShort(a.appliedDate),
    appliedDateFull: fmtFull(a.appliedDate),
    showDeadline: !!a.assignmentDue,
    hasAssignment: !!a.assignmentTitle,
    hasDesc: !!a.desc,
    hasLink: !!a.link,
    linkSource: linkSource(a.link),
    atsScoreVal: score,
    hasAts: score !== null,
    atsLabel: "ATS " + score,
    atsColor: score !== null ? atsColor(score) : "var(--text-faint)",
    referralLabel: a.referral ? "Yes" : "No",
    cvVersionLabel: a.cvVersion || "—",
    daysInStage: daysInStage(a),
    rejectedAtKey: a.rejectedAt || a.stage,
  };
}
