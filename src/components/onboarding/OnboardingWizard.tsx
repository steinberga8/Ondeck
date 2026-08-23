"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { LogoMark, CheckIcon, AlertIcon, LinkedInGlyph } from "@/components/icons";
import { Checkbox, PrimaryButton, TextInput, FieldLabel } from "@/components/onboarding/ui";
import { GoogleButton } from "@/components/onboarding/GoogleButton";
import { FocusStep, ExperienceStep, CvsStep, ConnectStep, BillingStep, toObCv, type ObCv, type BillingDraft } from "@/components/onboarding/steps";
import type { SafeUser } from "@/lib/serialize";

const OB_STEPS = [
  { n: "1", label: "Account" },
  { n: "2", label: "Focus" },
  { n: "3", label: "Experience" },
  { n: "4", label: "CVs" },
  { n: "5", label: "Connect" },
  { n: "6", label: "Billing" },
];

type AuthMode = "signup" | "signin";

async function postJson(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

export function OnboardingWizard() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { setUser } = useAuth();

  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [obStep, setObStep] = useState(0);
  const [accountCreated, setAccountCreated] = useState(false);

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [keepLogged, setKeepLogged] = useState(true);

  const [forgotView, setForgotView] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  const [fields, setFields] = useState<string[]>([]);
  const [exp, setExp] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [cvs, setCvs] = useState<ObCv[]>([]);
  const [li, setLi] = useState(true);
  const [mail, setMail] = useState(true);
  const [billing, setBilling] = useState<BillingDraft>({ method: "card", firstName: "", lastName: "", cardNumber: "", cvv: "", expiry: "" });

  const cvInputRef = useRef<HTMLInputElement>(null);

  const isLast = obStep === 5;
  const obShowNav = !(obStep === 0 && authMode === "signin");

  function enterApp(user: SafeUser) {
    setUser(user);
    router.push("/app");
  }

  function afterGoogleSuccess(user: SafeUser, isNew: boolean) {
    setAuthError("");
    if (isNew) {
      setEmail(user.email);
      setUsername(user.username);
      setAccountCreated(true);
      setObStep(1);
    } else {
      enterApp(user);
    }
  }

  async function handleSignIn() {
    const em = email.trim().toLowerCase();
    if (!em || !password) {
      setAuthError("Enter your email and password.");
      return;
    }
    setAuthBusy(true);
    setAuthError("");
    const { ok, data } = await postJson("/api/auth/login", { email: em, password, keepLoggedIn: keepLogged });
    setAuthBusy(false);
    if (!ok) {
      setAuthError(data.error ?? "Sign in failed.");
      return;
    }
    enterApp(data.user);
  }

  async function handleObNext() {
    if (obStep === 0 && authMode === "signup") {
      const uname = username.trim();
      const em = email.trim().toLowerCase();
      if (!uname || !em || !password) {
        setAuthError("Fill in username, email and password.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
        setAuthError("Enter a valid email address.");
        return;
      }
      if (password.length < 6) {
        setAuthError("Password must be at least 6 characters.");
        return;
      }
      if (!terms) {
        setAuthError("Accept the Terms & Conditions to continue.");
        return;
      }
      setAuthBusy(true);
      const { ok, data } = await postJson("/api/auth/signup", { username: uname, email: em, password, terms, keepLoggedIn: keepLogged });
      setAuthBusy(false);
      if (!ok) {
        setAuthError(data.error ?? "Sign up failed.");
        return;
      }
      setAuthError("");
      setUser(data.user);
      setAccountCreated(true);
      setObStep(1);
      return;
    }

    if (!isLast) {
      setObStep((s) => s + 1);
      return;
    }

    // Finishing the wizard: persist the profile-enrichment fields we collected,
    // then land in the app. Billing is UI-only here — no card data is ever sent
    // to the server (real payment processing is a separate handoff).
    setAuthBusy(true);
    await postJson("/api/profile", {
      fields,
      experience: exp,
      title,
      linkedinSynced: li,
      mailSynced: mail,
    });
    for (const cv of cvs) {
      await postJson("/api/cv-library", { name: cv.name, tag: cv.tag });
    }
    setAuthBusy(false);
    router.push("/app");
  }

  function handleAddCvFiles(fileList: FileList | null) {
    if (!fileList || !fileList.length) return;
    const added = Array.from(fileList).map((f, i) => toObCv(f, cvs.length + i));
    setCvs((c) => [...c, ...added]);
  }

  async function handleSendResetLink() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail.trim())) {
      setAuthError("Enter a valid email address.");
      return;
    }
    await postJson("/api/auth/forgot-password", { email: forgotEmail.trim() });
    setForgotSent(true);
    setAuthError("");
  }

  const themeBtn = (t: "dark" | "light" | "mixed", label: string) => (
    <div
      onClick={() => setTheme(t)}
      style={{
        padding: "5px 12px",
        borderRadius: 6,
        fontSize: 11,
        fontWeight: 700,
        cursor: "pointer",
        background: theme === t ? "var(--accent)" : "transparent",
        color: theme === t ? "var(--on-accent)" : "var(--text-faint)",
      }}
    >
      {label}
    </div>
  );

  return (
    <div style={{ flex: 1, height: "100vh", display: "flex", flexDirection: "column", alignItems: "center", overflowY: "auto", position: "relative" }}>
      <div className="om-grain" />
      <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 28px", flex: "none" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <LogoMark />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400, fontSize: 22 }}>Ondeck</div>
        </div>
        <div style={{ display: "flex", gap: 2, background: "var(--surface2)", border: "1px solid var(--border-soft)", borderRadius: 8, padding: 3 }}>
          {themeBtn("dark", "Dark")}
          {themeBtn("light", "Light")}
          {themeBtn("mixed", "Mixed")}
        </div>
      </div>

      <div style={{ width: 470, maxWidth: "92%", margin: "auto", padding: "30px 0 50px" }}>
        {obShowNav && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 30 }}>
            {OB_STEPS.map((p, i) => {
              const done = i < obStep;
              const current = i === obStep;
              return (
                <div key={p.n} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: "var(--font-mono)",
                      background: done ? "var(--green)" : current ? "var(--accent)" : "var(--surface2)",
                      color: done || current ? "var(--on-accent)" : "var(--text-faint)",
                      border: done || current ? "none" : "1px solid var(--border)",
                    }}
                  >
                    {done ? <CheckIcon /> : p.n}
                  </div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: current ? "var(--text)" : "var(--text-faint)" }}>{p.label}</div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 14, padding: "26px 28px", animation: "fadeUp 0.3s ease both" }}>
          {obStep === 0 && (
            <>
              <div style={{ display: "flex", gap: 2, background: "var(--surface2)", border: "1px solid var(--border-soft)", borderRadius: 9, padding: 3, marginBottom: 20 }}>
                <div
                  onClick={() => {
                    setAuthMode("signup");
                    setAuthError("");
                    setForgotView(false);
                  }}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: 7,
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    background: authMode === "signup" ? "var(--accent)" : "transparent",
                    color: authMode === "signup" ? "var(--on-accent)" : "var(--text-faint)",
                  }}
                >
                  Sign up
                </div>
                <div
                  onClick={() => {
                    setAuthMode("signin");
                    setAuthError("");
                    setForgotView(false);
                  }}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: 7,
                    borderRadius: 7,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    background: authMode === "signin" ? "var(--accent)" : "transparent",
                    color: authMode === "signin" ? "var(--on-accent)" : "var(--text-faint)",
                  }}
                >
                  Sign in
                </div>
              </div>

              {authError && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 12px",
                    marginBottom: 14,
                    background: "oklch(0.35 0.12 25 / 0.15)",
                    border: "1px solid oklch(0.6 0.15 25 / 0.4)",
                    borderRadius: 8,
                    fontSize: 11.5,
                    color: "oklch(0.75 0.15 25)",
                    fontWeight: 600,
                  }}
                >
                  <AlertIcon />
                  {authError}
                </div>
              )}

              {authMode === "signup" && (
                <>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 27, marginBottom: 4 }}>Create your account</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginBottom: 20 }}>Your job search, organized in one place.</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                    <div>
                      <FieldLabel>USERNAME</FieldLabel>
                      <TextInput value={username} onChange={(e) => setUsername(e.target.value)} placeholder="maya_k" />
                    </div>
                    <div>
                      <FieldLabel>EMAIL</FieldLabel>
                      <TextInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="maya@example.com" />
                    </div>
                    <div>
                      <FieldLabel>PASSWORD</FieldLabel>
                      <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 3 }}>
                      <Checkbox
                        checked={terms}
                        onClick={() => setTerms((v) => !v)}
                        label={
                          <>
                            I accept the{" "}
                            <a href="/terms" style={{ color: "var(--accent)", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 2 }}>
                              Terms &amp; Conditions
                            </a>
                          </>
                        }
                      />
                      <Checkbox checked={keepLogged} onClick={() => setKeepLogged((v) => !v)} label="Keep me logged in" />
                    </div>
                  </div>
                </>
              )}

              {authMode === "signin" && !forgotView && (
                <>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 27, marginBottom: 4 }}>Welcome back</div>
                  <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginBottom: 20 }}>Pick up your pipeline where you left it.</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                    <div>
                      <FieldLabel>EMAIL</FieldLabel>
                      <TextInput value={email} onChange={(e) => setEmail(e.target.value)} placeholder="maya@example.com" />
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                        <FieldLabel>PASSWORD</FieldLabel>
                        <span
                          onClick={() => {
                            setForgotView(true);
                            setForgotSent(false);
                            setAuthError("");
                          }}
                          style={{ fontSize: 10.5, fontWeight: 700, color: "var(--accent)", cursor: "pointer" }}
                        >
                          Forgot password?
                        </span>
                      </div>
                      <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                    </div>
                    <Checkbox checked={keepLogged} onClick={() => setKeepLogged((v) => !v)} label="Keep me logged in" />
                    <PrimaryButton onClick={handleSignIn} disabled={authBusy}>
                      {authBusy ? "Signing in…" : "Sign in"}
                    </PrimaryButton>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
                      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                      <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-faint)" }}>OR</span>
                      <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                    </div>
                    <GoogleButton keepLoggedIn={keepLogged} onSuccess={afterGoogleSuccess} onError={setAuthError} />
                  </div>
                </>
              )}

              {forgotView && (
                <>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 27, marginBottom: 4 }}>Reset your password</div>
                  {forgotSent ? (
                    <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginBottom: 18 }}>
                      If an account exists for that email, we&apos;ve sent a reset link. Check your inbox.
                    </div>
                  ) : (
                    <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginBottom: 20 }}>
                      Enter the email on your account — we&apos;ll send a reset link.
                    </div>
                  )}
                  <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                    <div>
                      <FieldLabel>EMAIL</FieldLabel>
                      <TextInput value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="maya@example.com" />
                    </div>
                    <PrimaryButton onClick={handleSendResetLink}>Send reset link</PrimaryButton>
                    <div
                      onClick={() => {
                        setForgotView(false);
                        setForgotSent(false);
                      }}
                      style={{ textAlign: "center", fontSize: 11.5, fontWeight: 700, color: "var(--text-dim)", cursor: "pointer" }}
                    >
                      ← Back to sign in
                    </div>
                  </div>
                </>
              )}

              {authMode === "signup" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "18px 0 14px" }}>
                    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "var(--text-faint)" }}>OR CONTINUE WITH</span>
                    <div style={{ flex: 1, height: 1, background: "var(--border)" }} />
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <GoogleButton keepLoggedIn={keepLogged} onSuccess={afterGoogleSuccess} onError={setAuthError} />
                    </div>
                    <div
                      onClick={() => setAuthError("LinkedIn sign-in isn't wired up yet — see the separate LinkedIn OAuth handoff.")}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 9,
                        padding: 11,
                        background: "oklch(1 0 0 / 0.15)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid oklch(1 0 0 / 0.2)",
                        borderRadius: 9,
                        cursor: "pointer",
                      }}
                    >
                      <LinkedInGlyph />
                      <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)" }}>LinkedIn</span>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {obStep === 1 && <FocusStep fields={fields} onToggle={(l) => setFields((f) => (f.includes(l) ? f.filter((x) => x !== l) : [...f, l]))} />}
          {obStep === 2 && <ExperienceStep exp={exp} title={title} onPick={setExp} onTitle={setTitle} />}
          {obStep === 3 && <CvsStep cvs={cvs} inputRef={cvInputRef} onFiles={handleAddCvFiles} onRemove={(id) => setCvs((c) => c.filter((x) => x.id !== id))} />}
          {obStep === 4 && <ConnectStep li={li} mail={mail} onToggleLi={() => setLi((v) => !v)} onToggleMail={() => setMail((v) => !v)} />}
          {obStep === 5 && <BillingStep draft={billing} onChange={(patch) => setBilling((b) => ({ ...b, ...patch }))} />}

          {obShowNav && (
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              {obStep > (accountCreated ? 1 : 0) && (
                <div
                  onClick={() => setObStep((s) => Math.max(accountCreated ? 1 : 0, s - 1))}
                  style={{ padding: "11px 18px", border: "1px solid var(--border)", borderRadius: 9, fontSize: 12.5, fontWeight: 700, color: "var(--text-dim)", cursor: "pointer" }}
                >
                  Back
                </div>
              )}
              <div style={{ flex: 1 }}>
                <PrimaryButton onClick={handleObNext} disabled={authBusy}>
                  {isLast ? "Enter Ondeck" : "Continue"}
                </PrimaryButton>
              </div>
            </div>
          )}
        </div>
        {obStep > 0 && (
          <div onClick={() => router.push("/app")} style={{ textAlign: "center", marginTop: 16, fontSize: 12, color: "var(--text-faint)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
            Skip setup for now
          </div>
        )}
      </div>
    </div>
  );
}
