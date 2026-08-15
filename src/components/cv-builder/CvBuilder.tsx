"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { hashStr, atsColor } from "@/lib/ats";

/**
 * Ported verbatim from the design prototype's CVB_QUESTIONS / CVB_STOPWORDS /
 * extractCvbKeywords / fillCvbKw / CVB_REWRITES. Entirely client-side chat
 * state — the original never persisted any of this either, and there's no
 * real file storage backend, so CV names here are metadata only.
 */

const CVB_QUESTIONS = [
  { q: "First — what role are you targeting? Based on the JD, {kw0} experience looks important here.", hint: "e.g. Senior Frontend Engineer" },
  { q: "Tell me about your most recent position — title, company, and roughly how long you were there.", hint: "e.g. Frontend Engineer at Acme, 3 years" },
  { q: "The JD leans on {kw1} — walk me through one project tied to that, even loosely. What did you do, and what was the outcome? A number helps.", hint: "e.g. Rebuilt checkout, +12% conversion" },
  { q: "Which tools and technologies do you use daily? Separate them with commas — these become your ATS keywords.", hint: "e.g. React, TypeScript, Figma, SQL" },
  { q: "Last one: where did you study, and what did you earn there?", hint: "e.g. BSc Computer Science, TU Berlin" },
];

const CVB_STOPWORDS = new Set([
  "about", "their", "which", "would", "should", "other", "there", "these", "those", "where", "while", "after",
  "before", "being", "through", "during", "years", "skills", "ability", "strong", "proven", "experience",
  "working", "looking", "required", "responsible", "including", "across", "within", "using", "company",
  "company’s", "position", "candidate", "candidates",
]);

function extractCvbKeywords(jd: string): string[] {
  if (!jd) return [];
  const words = jd.toLowerCase().match(/[a-z][a-z-]{4,}/g) || [];
  const freq: Record<string, number> = {};
  const order: string[] = [];
  words.forEach((w) => {
    if (CVB_STOPWORDS.has(w)) return;
    if (!(w in freq)) order.push(w);
    freq[w] = (freq[w] || 0) + 1;
  });
  return order
    .sort((a, b) => freq[b] - freq[a])
    .slice(0, 3)
    .map((w) => w[0].toUpperCase() + w.slice(1));
}

function fillCvbKw(str: string, kws: string[]): string {
  return str.replace(/\{kw(\d)\}/g, (_m, i) => kws[+i] || "this role’s core skills");
}

const CVB_REWRITES = [
  { weak: "Responsible for the company website.", strong: "Rebuilt the marketing site in Next.js, cutting load time 38% and lifting sign-ups 12%." },
  { weak: "Worked with the design team on new features.", strong: "Partnered with 3 designers to ship a component library now used across 5 product teams." },
  { weak: "Helped improve internal processes.", strong: "Automated release checklists, saving the team ~6 hours per week." },
];

type CvbMessage = { id: string; kind: "bot" | "user" | "rewrite"; text?: string; weak?: string; strong?: string };
type Phase = "intake" | "chat" | "summary" | "shaped";
type CvLibItem = { id: string; name: string; date: string; tag: string };
type ProfileLink = { id: string; label: string; url: string };

let msgId = 0;
const nextId = () => `m${msgId++}`;

export function CvBuilder() {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("intake");
  const [jd, setJd] = useState("");
  const [cvName, setCvName] = useState("");
  const [cvLibrary, setCvLibrary] = useState<CvLibItem[]>([]);
  const [links, setLinks] = useState<ProfileLink[]>([]);
  const [messages, setMessages] = useState<CvbMessage[]>([]);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState("");
  const [answers, setAnswers] = useState<string[]>(["", "", "", "", ""]);
  const [rewriteUsed, setRewriteUsed] = useState(false);
  const [exported, setExported] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/cv-library")
      .then((r) => r.json())
      .then((d) => setCvLibrary(d.items ?? []))
      .catch(() => {});
    fetch("/api/profile-links")
      .then((r) => r.json())
      .then((d) => setLinks(d.links ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, phase]);

  const kws = useMemo(() => extractCvbKeywords(jd), [jd]);
  const questions = useMemo(() => CVB_QUESTIONS.map((q) => ({ ...q, text: fillCvbKw(q.q, kws) })), [kws]);

  const introScore = jd && cvName ? 55 + (hashStr(cvName + jd.length) % 41) : null;

  function addBot(text: string) {
    setMessages((m) => [...m, { id: nextId(), kind: "bot", text }]);
  }
  function addUser(text: string) {
    setMessages((m) => [...m, { id: nextId(), kind: "user", text }]);
  }

  function startInterview() {
    if (!jd.trim() || !cvName.trim()) return;
    setPhase("chat");
    setStep(0);
    addBot(questions[0].text);
  }

  function send() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    addUser(text);

    if (phase === "chat") {
      setAnswers((a) => {
        const next = [...a];
        next[step] = text;
        return next;
      });
      if (step < CVB_QUESTIONS.length - 1) {
        const nextStep = step + 1;
        setStep(nextStep);
        addBot(questions[nextStep].text);
      } else {
        setPhase("summary");
        addBot(
          "Here's what I changed — I set your target role, pulled in the most recent position, tied it to the project you described, and turned your daily tools into ATS keywords. Type any tweaks below, or hit \"Looks good\" to generate it."
        );
      }
    } else if (phase === "summary") {
      addBot("Noted — I'll fold that in.");
    }
  }

  function approve() {
    setPhase("shaped");
    const kw1 = kws[1] || "the project you described";
    addBot(`Done — I shaped your CV around your ${answers[0] || "target role"} and the ${kw1} work you described. It's ready in the preview — export whenever you like.`);
  }

  function doRewrite() {
    setRewriteUsed(true);
    setMessages((m) => [
      ...m,
      { id: nextId(), kind: "bot", text: "Here are a few weak bullets swapped for stronger ones — feel free to reuse the pattern in your own answers:" },
      ...CVB_REWRITES.map((r) => ({ id: nextId(), kind: "rewrite" as const, weak: r.weak, strong: r.strong })),
    ]);
  }

  const showInput = phase === "chat" || phase === "summary";
  const canOfferRewrite = phase !== "intake" && !rewriteUsed;
  const hint = phase === "chat" ? questions[step]?.hint : "Any tweaks? e.g. emphasize leadership more";

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, padding: "22px 28px", height: "100%", boxSizing: "border-box" }}>
      {/* CHAT PANE */}
      <div style={{ display: "flex", flexDirection: "column", background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 14, overflow: "hidden", minHeight: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 18px", borderBottom: "1px solid var(--border-soft)", flex: "none" }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "var(--on-accent)", flex: "none" }}>R</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 800 }}>CV Tailor</div>
            <div style={{ fontSize: 10.5, color: "var(--text-faint)" }}>Tailors your CV to one job description</div>
          </div>
          <span style={{ fontSize: 8.5, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--accent)", background: "var(--accent-soft)", padding: "2px 5px", borderRadius: 4, letterSpacing: "0.05em" }}>BETA</span>
        </div>

        <div ref={transcriptRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
          {phase === "intake" && (
            <>
              <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: "var(--accent)", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "var(--on-accent)" }}>R</div>
                <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "9px 12px", fontSize: 12.5, lineHeight: 1.5, maxWidth: "90%" }}>
                  I tailor your CV to a specific job. Paste the job description and pick your current CV — I&apos;ll run a short screening interview, then shape a version aimed at this role.
                </div>
              </div>

              <div style={{ marginLeft: 29, display: "flex", flexDirection: "column", gap: 6, maxWidth: "90%" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Job description</div>
                <textarea
                  value={jd}
                  onChange={(e) => setJd(e.target.value)}
                  placeholder="Paste the job description here…"
                  style={{ width: "100%", minHeight: 74, resize: "vertical", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 9, padding: "10px 12px", color: "var(--text)", fontFamily: "var(--font-ui)", fontSize: 12, lineHeight: 1.5, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ marginLeft: 29, display: "flex", flexDirection: "column", gap: 6, maxWidth: "90%" }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Your CV</div>
                {cvLibrary.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {cvLibrary.map((cv) => (
                      <div
                        key={cv.id}
                        onClick={() => setCvName(cv.name)}
                        style={{
                          padding: "6px 11px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                          background: cvName === cv.name ? "var(--accent)" : "var(--surface2)",
                          color: cvName === cv.name ? "var(--on-accent)" : "var(--text-dim)",
                          border: cvName === cv.name ? "1px solid var(--accent)" : "1px solid var(--border)",
                        }}
                      >
                        {cv.name}
                      </div>
                    ))}
                  </div>
                )}
                <input
                  value={cvName}
                  onChange={(e) => setCvName(e.target.value)}
                  placeholder="CV file name — e.g. resume_v2.pdf"
                  style={{ width: "100%", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 9, padding: "10px 12px", color: "var(--text)", fontFamily: "var(--font-ui)", fontSize: 12, outline: "none", boxSizing: "border-box" }}
                />
              </div>

              {introScore !== null && (
                <div style={{ marginLeft: 29, display: "flex", alignItems: "center", gap: 8, maxWidth: "90%" }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: atsColor(introScore) }}>{introScore}</span>
                  <span style={{ fontSize: 11, color: "var(--text-faint)" }}>estimated match before tailoring</span>
                </div>
              )}

              <div
                onClick={startInterview}
                style={{
                  marginLeft: 29,
                  alignSelf: "flex-start",
                  padding: "9px 16px",
                  borderRadius: 9,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: jd.trim() && cvName.trim() ? "pointer" : "default",
                  opacity: jd.trim() && cvName.trim() ? 1 : 0.5,
                  background: "var(--accent)",
                  color: "var(--on-accent)",
                }}
              >
                Start screening interview
              </div>
            </>
          )}

          {messages.map((msg) =>
            msg.kind === "bot" ? (
              <div key={msg.id} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                <div style={{ width: 20, height: 20, borderRadius: 6, background: "var(--accent)", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "var(--on-accent)" }}>R</div>
                <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "9px 12px", fontSize: 12.5, lineHeight: 1.5, maxWidth: "85%" }}>{msg.text}</div>
              </div>
            ) : msg.kind === "user" ? (
              <div key={msg.id} style={{ display: "flex", justifyContent: "flex-end" }}>
                <div style={{ background: "var(--accent-soft)", color: "var(--text)", borderRadius: 10, padding: "9px 12px", fontSize: 12.5, lineHeight: 1.5, maxWidth: "85%" }}>{msg.text}</div>
              </div>
            ) : (
              <div key={msg.id} style={{ marginLeft: 29, maxWidth: "85%", background: "var(--surface2)", border: "1px solid var(--border-soft)", borderRadius: 10, padding: "11px 13px", display: "flex", flexDirection: "column", gap: 7 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ flex: "none", fontSize: 9, fontWeight: 800, fontFamily: "var(--font-mono)", color: "oklch(0.68 0.19 25)", background: "oklch(0.62 0.19 25 / 0.13)", padding: "2px 6px", borderRadius: 4, marginTop: 1 }}>WEAK</span>
                  <span style={{ fontSize: 11.5, lineHeight: 1.45, color: "var(--text-faint)", textDecoration: "line-through", textDecorationColor: "oklch(0.62 0.19 25 / 0.6)" }}>{msg.weak}</span>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ flex: "none", fontSize: 9, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--green)", background: "var(--green-soft)", padding: "2px 6px", borderRadius: 4, marginTop: 1 }}>STRONG</span>
                  <span style={{ fontSize: 12, lineHeight: 1.45, color: "var(--text)" }}>{msg.strong}</span>
                </div>
              </div>
            )
          )}

          {canOfferRewrite && (
            <div
              onClick={doRewrite}
              style={{ marginLeft: 29, alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 7, padding: "8px 13px", background: "var(--accent-soft)", border: "1px solid oklch(0.64 0.19 276 / 0.3)", borderRadius: 20, cursor: "pointer", fontSize: 11.5, fontWeight: 700, color: "var(--accent)" }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" fill="currentColor" /></svg>
              Rewrite my weak bullets
            </div>
          )}

          {phase === "summary" && (
            <div onClick={approve} style={{ marginLeft: 29, alignSelf: "flex-start", display: "flex", alignItems: "center", gap: 7, padding: "9px 15px", background: "var(--accent)", borderRadius: 20, cursor: "pointer", fontSize: 11.5, fontWeight: 700, color: "var(--on-accent)" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M4 12L10 18L20 6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
              Looks good — generate it
            </div>
          )}
        </div>

        {showInput && (
          <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderTop: "1px solid var(--border-soft)", flex: "none" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={hint}
              style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 9, padding: "10px 13px", color: "var(--text)", fontFamily: "var(--font-ui)", fontSize: 12.5, outline: "none" }}
            />
            <div onClick={send} style={{ width: 40, borderRadius: 9, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flex: "none" }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 12H19M19 12L13 6M19 12L13 18" stroke="var(--on-accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          </div>
        )}
      </div>

      {/* LIVE PREVIEW */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", background: "white", borderRadius: 12, border: "1px solid var(--border)", padding: "30px 32px", color: "#1f2430" }}>
          <div style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontSize: 26, fontWeight: 400, color: "#14171f" }}>{user?.username || "Your name"}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: answers[0] ? "#2a3040" : "#a8adb8", marginBottom: 4 }}>{answers[0] || "Your target role appears here"}</div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "#7a8090", marginBottom: 6 }}>{user?.email}</div>

          {links.length > 0 ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
              {links.map((link) => (
                <a key={link.id} href={link.url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-mono)", fontSize: 10, color: "#4a5578", textDecoration: "none", borderBottom: "1px solid #d5d9e4", paddingBottom: 1 }}>
                  {link.label}
                </a>
              ))}
            </div>
          ) : (
            <div style={{ marginBottom: 12 }} />
          )}

          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.08em", color: "#7a8090", borderBottom: "1px solid #e4e6ec", paddingBottom: 4, marginBottom: 8 }}>EXPERIENCE</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.6, color: answers[1] ? "#1f2430" : "#a8adb8", marginBottom: 16 }}>{answers[1] || "Your most recent role appears here as you answer."}</div>

          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.08em", color: "#7a8090", borderBottom: "1px solid #e4e6ec", paddingBottom: 4, marginBottom: 8 }}>KEY PROJECT</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.6, color: answers[2] ? "#1f2430" : "#a8adb8", marginBottom: 16 }}>{answers[2] || "A project tied to the JD's core skill appears here."}</div>

          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.08em", color: "#7a8090", borderBottom: "1px solid #e4e6ec", paddingBottom: 4, marginBottom: 8 }}>SKILLS &amp; KEYWORDS</div>
          {answers[3] ? (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
              {answers[3].split(",").map((s) => s.trim()).filter(Boolean).map((skill) => (
                <span key={skill} style={{ fontSize: 10.5, fontFamily: "var(--font-mono)", background: "#eef0f5", color: "#3d4560", padding: "3px 9px", borderRadius: 12, border: "1px solid #e0e3ea" }}>{skill}</span>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: 12.5, color: "#a8adb8", marginBottom: 16 }}>Your daily tools become ATS keywords here.</div>
          )}

          <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: "0.08em", color: "#7a8090", borderBottom: "1px solid #e4e6ec", paddingBottom: 4, marginBottom: 8 }}>EDUCATION</div>
          <div style={{ fontSize: 12.5, lineHeight: 1.6, color: answers[4] ? "#1f2430" : "#a8adb8" }}>{answers[4] || "Where you studied appears here."}</div>
        </div>

        <div style={{ flex: "none" }}>
          <div
            onClick={() => phase === "shaped" && setExported(true)}
            title={phase !== "shaped" ? "Finish the interview to export" : undefined}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: 11,
              borderRadius: 9,
              fontSize: 12.5,
              fontWeight: 700,
              cursor: phase === "shaped" ? "pointer" : "default",
              opacity: phase === "shaped" ? 1 : 0.5,
              background: "var(--accent)",
              color: "var(--on-accent)",
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 15V3M12 15L8 11M12 15L16 11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            Export CV
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 6 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-faint)" }}>PDF only</span>
            {exported && <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--green)" }}>· cv_shaped.pdf downloaded ✓</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
