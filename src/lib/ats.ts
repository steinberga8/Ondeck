/**
 * Mock ATS scoring — ported verbatim from the design prototype's `renderVals()`
 * logic. Every number here is a deterministic hash of the application's own
 * text (company / role / CV name / JD length), not a real ATS/NLP pipeline —
 * there's no such backend in scope. Keep the formulas byte-for-byte identical
 * to the prototype so re-scoring the same application always gives the same
 * (illustrative) numbers.
 */

export type AtsApplication = {
  company: string;
  role: string;
  cvVersion: string | null;
  desc: string | null;
};

export function hashStr(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

export function atsScore(a: AtsApplication): number | null {
  if (!a.desc) return null;
  const key = a.company + "|" + (a.cvVersion || "") + "|" + a.desc.length;
  return 55 + (hashStr(key) % 41);
}

export function atsColor(score: number): string {
  return score >= 80 ? "var(--green)" : score >= 65 ? "var(--amber)" : "oklch(0.68 0.19 25)";
}

export const ATS_GRAMMAR_BANK = [
  { weak: "Responsible for managing client relationships.", issue: "PASSIVE / DUTY-FOCUSED", strong: "Managed 40+ client relationships, retaining 95% year-over-year." },
  { weak: "Worked on improving team processes.", issue: "VAGUE VERB, NO OUTCOME", strong: "Redesigned onboarding process, cutting ramp time from 6 to 3 weeks." },
  { weak: "Helped with the launch of a new product.", issue: '"HELPED" UNDERSELLS OWNERSHIP', strong: "Led launch of a new product line, reaching 10K users in month one." },
  { weak: "Utilized various tools to complete tasks.", issue: '"UTILIZED / VARIOUS" ARE FILLER', strong: "Used Salesforce and Looker daily to track pipeline health." },
  { weak: "Good communication and team player.", issue: "UNVERIFIABLE SOFT-SKILL CLAIM", strong: "Presented weekly updates to a 12-person cross-functional team." },
];

export type AtsCategory = { label: string; score: number; note: string };
export type AtsGrammarIssue = { weak: string; issue: string; strong: string };
export type AtsBreakdownResult = { categories: AtsCategory[]; hrNotes: string[]; grammarIssues: AtsGrammarIssue[] };

export function atsBreakdown(a: AtsApplication): AtsBreakdownResult | null {
  const sc = atsScore(a);
  if (sc === null) return null;
  const h = hashStr(a.company + (a.desc || ""));
  const formatting = 78 + (h % 18);
  const grammar = 70 + ((h >> 3) % 26);
  const structure = 75 + ((h >> 5) % 20);

  const categories: AtsCategory[] = [
    {
      label: "Keyword Match",
      score: sc,
      note: sc >= 80 ? "Strong overlap with the JD’s core terms." : sc >= 65 ? "Decent overlap, but a few high-signal terms are missing." : "Low overlap — an ATS keyword filter may deprioritize this.",
    },
    {
      label: "Formatting & Parsing",
      score: formatting,
      note: formatting >= 85 ? "Clean single-column layout — parses cleanly into fields." : "Mostly parses fine; watch for tables, icons or multi-column sections that ATS text-extractors can scramble.",
    },
    {
      label: "Grammar & Tone",
      score: grammar,
      note: grammar >= 85 ? "Clear, active-voice bullets throughout." : "A few passive or vague phrasings a recruiter would skim past.",
    },
    {
      label: "Structure & Sections",
      score: structure,
      note: structure >= 85 ? "Standard section headers (Experience, Education, Skills) an ATS recognizes instantly." : 'Section headers are mostly standard — keep them literal, avoid creative labels like "My Journey".',
    },
  ];

  const hrNotes = [
    `First 6-second scan lands on your most recent title and company — make sure it echoes the "${a.role || "role"}" language they searched for.`,
    "Recruiters skim for a number in the first two bullets — lead with a metric, not a duty.",
    "Contact info and location get checked for logistics fit before anything else is read closely.",
  ];

  const issueCount = 2 + (h % 2);
  const grammarIssues: AtsGrammarIssue[] = [];
  for (let i = 0; i < issueCount; i++) grammarIssues.push(ATS_GRAMMAR_BANK[(h + i) % ATS_GRAMMAR_BANK.length]);

  return { categories, hrNotes, grammarIssues };
}
