"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { FieldLabel, ModalOverlay, PrimaryButton, SecondaryButton, TextInput, Toggle } from "@/components/app/ui";
import type { SafeUser } from "@/lib/serialize";
import { useTrialDaysLeft } from "@/lib/useTrialDaysLeft";

type ProfileLink = { id: string; label: string; url: string };
type CvLibItem = { id: string; name: string; date: string; tag: string };
type BillMethod = "card" | "paypal" | "applepay";

function initials(name: string) {
  return name.split(/[\s._-]+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
}

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 12, padding: "18px 20px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: sub ? 4 : 14 }}>{title}</div>
      {sub && <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginBottom: 14, lineHeight: 1.5 }}>{sub}</div>}
      {children}
    </div>
  );
}

export function ProfilePage() {
  const { user, setUser, logout } = useAuth();
  const router = useRouter();

  const [username, setUsername] = useState("");
  const [title, setTitle] = useState("");
  const [location, setLocationVal] = useState("");
  useEffect(() => {
    // Only re-sync from the server on login (a new user id) — not on every
    // PATCH echo — so we don't clobber what's mid-typing in these fields.
    if (user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUsername(user.username);
      setTitle(user.title ?? "");
      setLocationVal(user.location ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const [links, setLinks] = useState<ProfileLink[]>([]);
  const [newLink, setNewLink] = useState("");
  const [cvLibrary, setCvLibrary] = useState<CvLibItem[]>([]);
  const [newCvName, setNewCvName] = useState("");

  useEffect(() => {
    fetch("/api/profile-links").then((r) => r.json()).then((d) => setLinks(d.links ?? [])).catch(() => {});
    fetch("/api/cv-library").then((r) => r.json()).then((d) => setCvLibrary(d.items ?? [])).catch(() => {});
  }, []);

  const [billMethod, setBillMethod] = useState<BillMethod>("card");
  const [billFirstName, setBillFirstName] = useState("");
  const [billLastName, setBillLastName] = useState("");
  const [billCardNumber, setBillCardNumber] = useState("");
  const [billCvv, setBillCvv] = useState("");
  const [billExpiry, setBillExpiry] = useState("");

  const [logoutModal, setLogoutModal] = useState<0 | 1 | 2>(0);
  const [loggingOut, setLoggingOut] = useState(false);

  async function patchProfile(patch: Partial<SafeUser>) {
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      const data = await res.json();
      setUser(data.user);
    }
  }

  async function addLink() {
    const url = newLink.trim();
    if (!url) return;
    const res = await fetch("/api/profile-links", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
    if (res.ok) {
      const data = await res.json();
      setLinks((l) => [...l, data.link]);
      setNewLink("");
    }
  }

  async function removeLink(id: string) {
    setLinks((l) => l.filter((x) => x.id !== id));
    await fetch(`/api/profile-links/${id}`, { method: "DELETE" });
  }

  async function addCv() {
    const name = newCvName.trim();
    if (!name) return;
    const res = await fetch("/api/cv-library", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
    if (res.ok) {
      const data = await res.json();
      setCvLibrary((c) => [data.item, ...c]);
      setNewCvName("");
    }
  }

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.push("/");
  }

  const trialDaysLeft = useTrialDaysLeft(user?.trialStartedAt ?? new Date().toISOString());
  const trialActive = trialDaysLeft > 0 && !user?.subscribed;

  if (!user) {
    return <div style={{ padding: 40, color: "var(--text-dim)", fontSize: 13 }}>Loading…</div>;
  }

  const goalApps = user.goalApps ?? 5;
  const goalMocks = user.goalMocks ?? 2;

  const methodBtn = (key: BillMethod): React.CSSProperties => ({
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    padding: 11,
    borderRadius: 9,
    cursor: "pointer",
    fontSize: 12.5,
    fontWeight: 700,
    border: billMethod === key ? "1px solid var(--accent)" : "1px solid var(--border)",
    background: billMethod === key ? "var(--accent-soft)" : "var(--surface2)",
    color: billMethod === key ? "var(--accent)" : "var(--text-dim)",
  });

  return (
    <div style={{ padding: "22px 28px 60px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: 16, alignItems: "start" }}>
      {/* IDENTITY */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 12, padding: "22px 24px", gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--accent-soft)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 22, flex: "none" }}>
          {initials(user.username || user.email)}
        </div>
        <div style={{ flex: 1, minWidth: 220, display: "flex", flexDirection: "column", gap: 8 }}>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onBlur={() => username.trim() && username !== user.username && patchProfile({ username: username.trim() })}
            placeholder="Your name"
            style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid var(--border)", padding: "2px 0", color: "var(--text)", fontFamily: "var(--font-display)", fontSize: 20, outline: "none" }}
          />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => patchProfile({ title: title.trim() })}
            placeholder="Your headline — e.g. Senior Frontend Engineer"
            style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid var(--border-soft)", padding: "2px 0", color: "var(--text-dim)", fontFamily: "var(--font-ui)", fontSize: 13, outline: "none" }}
          />
          <input
            value={location}
            onChange={(e) => setLocationVal(e.target.value)}
            onBlur={() => patchProfile({ location: location.trim() })}
            placeholder="Location — e.g. Berlin, Germany"
            style={{ width: "100%", background: "transparent", border: "none", borderBottom: "1px solid var(--border-soft)", padding: "2px 0", color: "var(--text-dim)", fontFamily: "var(--font-ui)", fontSize: 12.5, outline: "none" }}
          />
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)" }}>{user.email}</div>
        </div>
        <div onClick={() => setLogoutModal(1)} style={{ flex: "none", display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "var(--red)", background: "var(--red-soft)", border: "1px solid oklch(0.62 0.19 25 / 0.35)" }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          Log out
        </div>
      </div>

      {/* BILLING */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 12, padding: "18px 20px", gridColumn: "1 / -1" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em" }}>Billing</div>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, color: user.subscribed ? "var(--green)" : trialDaysLeft <= 3 ? "var(--amber)" : "var(--text-faint)" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" /><path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            {user.subscribed ? `Subscribed · ${user.billingPlan || "card"}` : trialActive ? `${trialDaysLeft} ${trialDaysLeft === 1 ? "day" : "days"} left in trial` : "Trial ended"}
          </span>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginBottom: 16, lineHeight: 1.5 }}>
          Ondeck is <strong style={{ color: "var(--text-dim)", fontWeight: 700 }}>$5/month</strong> after your 14-day free trial. Card data is never stored on Ondeck&apos;s servers — this is a mock billing flow; no real charge is made.
        </div>

        {!user.subscribed && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              <div onClick={() => setBillMethod("card")} style={methodBtn("card")}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.7" /><line x1="2" y1="9.5" x2="22" y2="9.5" stroke="currentColor" strokeWidth="1.7" /></svg>
                Card
              </div>
              <div onClick={() => setBillMethod("paypal")} style={methodBtn("paypal")}>PayPal</div>
              <div onClick={() => setBillMethod("applepay")} style={methodBtn("applepay")}>Apple Pay</div>
            </div>

            {billMethod === "card" && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 14px", marginBottom: 14 }}>
                  <div>
                    <FieldLabel>FIRST NAME</FieldLabel>
                    <TextInput value={billFirstName} onChange={(e) => setBillFirstName(e.target.value)} />
                  </div>
                  <div>
                    <FieldLabel>LAST NAME</FieldLabel>
                    <TextInput value={billLastName} onChange={(e) => setBillLastName(e.target.value)} />
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <FieldLabel>CARD NUMBER</FieldLabel>
                  <TextInput value={billCardNumber} onChange={(e) => setBillCardNumber(e.target.value)} placeholder="•••• •••• •••• ••••" style={{ fontFamily: "var(--font-mono)" }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
                  <div>
                    <FieldLabel>CVV</FieldLabel>
                    <TextInput value={billCvv} onChange={(e) => setBillCvv(e.target.value)} placeholder="•••" style={{ fontFamily: "var(--font-mono)" }} />
                  </div>
                  <div>
                    <FieldLabel>EXPIRATION</FieldLabel>
                    <TextInput value={billExpiry} onChange={(e) => setBillExpiry(e.target.value)} placeholder="MM / YY" style={{ fontFamily: "var(--font-mono)" }} />
                  </div>
                </div>
              </>
            )}
            {billMethod === "paypal" && (
              <div style={{ padding: 16, background: "var(--surface2)", border: "1px solid var(--border-soft)", borderRadius: 10, fontSize: 12.5, color: "var(--text-dim)", textAlign: "center", marginBottom: 16 }}>
                You&apos;ll be redirected to PayPal to link your account after this step.
              </div>
            )}
            {billMethod === "applepay" && (
              <div style={{ padding: 16, background: "var(--surface2)", border: "1px solid var(--border-soft)", borderRadius: 10, fontSize: 12.5, color: "var(--text-dim)", textAlign: "center", marginBottom: 16 }}>
                Confirm with Face ID / Touch ID to link Apple Pay after this step.
              </div>
            )}

            <PrimaryButton style={{ display: "inline-block" }} onClick={() => patchProfile({ subscribed: true, billingPlan: billMethod })}>
              Subscribe — $5/month
            </PrimaryButton>
          </>
        )}

        {user.subscribed && (
          <div
            onClick={() => patchProfile({ subscribed: false })}
            style={{ fontSize: 11.5, color: "var(--text-faint)", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3, display: "inline-block" }}
          >
            Cancel subscription
          </div>
        )}
      </div>

      {/* JOB SEARCH GOALS */}
      <Card title="Job Search Goals" sub="Simple weekly targets you set for yourself.">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>Applications per week</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div onClick={() => patchProfile({ goalApps: Math.max(1, goalApps - 1) })} style={{ width: 22, height: 22, borderRadius: 6, background: "var(--surface2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: 700, color: "var(--text-dim)", fontSize: 13 }}>−</div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, minWidth: 20, textAlign: "center" }}>{goalApps}</span>
                <div onClick={() => patchProfile({ goalApps: goalApps + 1 })} style={{ width: 22, height: 22, borderRadius: 6, background: "var(--surface2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: 700, color: "var(--text-dim)", fontSize: 13 }}>+</div>
              </div>
            </div>
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600 }}>Mock screenings per week</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div onClick={() => patchProfile({ goalMocks: Math.max(0, goalMocks - 1) })} style={{ width: 22, height: 22, borderRadius: 6, background: "var(--surface2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: 700, color: "var(--text-dim)", fontSize: 13 }}>−</div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 600, minWidth: 20, textAlign: "center" }}>{goalMocks}</span>
                <div onClick={() => patchProfile({ goalMocks: goalMocks + 1 })} style={{ width: 22, height: 22, borderRadius: 6, background: "var(--surface2)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontWeight: 700, color: "var(--text-dim)", fontSize: 13 }}>+</div>
              </div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 7 }}>Target date for offer</div>
            <TextInput
              type="date"
              value={user.goalDate ?? ""}
              onChange={(e) => patchProfile({ goalDate: e.target.value })}
              style={{ fontFamily: "var(--font-mono)" }}
            />
          </div>
        </div>
      </Card>

      {/* INTEGRATIONS */}
      <Card title="Integrations">
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 18 }}>
          <div onClick={() => patchProfile({ linkedinSynced: !user.linkedinSynced })} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--surface2)", border: "1px solid var(--border-soft)", borderRadius: 10, cursor: "pointer" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "oklch(0.55 0.12 250)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 12, color: "white", flex: "none" }}>in</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>LinkedIn</div>
              <div style={{ fontSize: 10.5, color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>{user.linkedinSynced ? "synced" : "not connected"}</div>
            </div>
            <Toggle on={user.linkedinSynced} onClick={() => patchProfile({ linkedinSynced: !user.linkedinSynced })} />
          </div>
          <div onClick={() => patchProfile({ mailSynced: !user.mailSynced })} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "var(--surface2)", border: "1px solid var(--border-soft)", borderRadius: 10, cursor: "pointer" }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "var(--surface3)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="var(--text-dim)" strokeWidth="1.8" /><path d="M3 7L12 13L21 7" stroke="var(--text-dim)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700 }}>Mail</div>
              <div style={{ fontSize: 10.5, color: "var(--text-faint)", fontFamily: "var(--font-mono)" }}>{user.mailSynced ? "synced" : "not connected"}</div>
            </div>
            <Toggle on={user.mailSynced} onClick={() => patchProfile({ mailSynced: !user.mailSynced })} />
          </div>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>Links &amp; Websites</div>
        <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginBottom: 12 }}>Shown under your name on every CV the builder produces.</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
          {links.map((link) => (
            <div key={link.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", background: "var(--surface2)", border: "1px solid var(--border-soft)", borderRadius: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, flex: "none" }}>{link.label}</span>
              <a href={link.url} target="_blank" rel="noreferrer" style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)", flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", textDecoration: "none" }}>
                {link.url}
              </a>
              <div onClick={() => removeLink(link.id)} style={{ width: 20, height: 20, borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", background: "var(--surface3)", flex: "none" }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none"><path d="M5 5L19 19M19 5L5 19" stroke="var(--text-dim)" strokeWidth="2.4" strokeLinecap="round" /></svg>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={newLink}
            onChange={(e) => setNewLink(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addLink()}
            placeholder="https://… (LinkedIn, GitHub, portfolio)"
            style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 11.5, outline: "none" }}
          />
          <div onClick={addLink} style={{ display: "flex", alignItems: "center", padding: "0 14px", borderRadius: 8, background: "var(--accent)", color: "var(--on-accent)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Add</div>
        </div>
      </Card>

      {/* CV LIBRARY */}
      <Card title="CV Library">
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
          {cvLibrary.length === 0 && <div style={{ fontSize: 11.5, color: "var(--text-faint)" }}>No CVs on file yet.</div>}
          {cvLibrary.map((cv) => (
            <div key={cv.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--surface2)", border: "1px solid var(--border-soft)", borderRadius: 8 }}>
              <div style={{ width: 32, flex: "none", textAlign: "center", fontSize: 8.5, fontWeight: 800, fontFamily: "var(--font-mono)", color: "var(--accent)", background: "var(--accent-soft)", padding: "3px 0", borderRadius: 5 }}>{cv.tag}</div>
              <div style={{ fontSize: 11.5, fontWeight: 600, flex: 1, minWidth: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cv.name}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-faint)", flex: "none" }}>{cv.date}</div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={newCvName}
            onChange={(e) => setNewCvName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCv()}
            placeholder="e.g. resume_backend_v3.pdf"
            style={{ flex: 1, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "9px 12px", color: "var(--text)", fontFamily: "var(--font-mono)", fontSize: 11.5, outline: "none" }}
          />
          <div onClick={addCv} style={{ display: "flex", alignItems: "center", padding: "0 14px", borderRadius: 8, background: "var(--accent)", color: "var(--on-accent)", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Add</div>
        </div>
      </Card>

      {/* SESSION */}
      <Card title="Session">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 12, color: "var(--text-dim)" }}>Sign out of Ondeck on this device.</div>
          <div onClick={() => setLogoutModal(1)} style={{ flex: "none", display: "flex", alignItems: "center", gap: 7, padding: "9px 16px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "var(--accent)", background: "var(--accent-soft)", border: "1px solid oklch(0.72 0.14 195 / 0.35)" }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            Log out
          </div>
        </div>
      </Card>

      {logoutModal === 1 && (
        <ModalOverlay onClose={() => setLogoutModal(0)} width={380}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M16 17L21 12L16 7" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><line x1="21" y1="12" x2="9" y2="12" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" /><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>Log out of Ondeck?</div>
          <div style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.5, marginBottom: 20 }}>You&apos;ll need to sign back in to see your pipeline, analytics and CVs.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <SecondaryButton onClick={() => setLogoutModal(0)} style={{ flex: 1 }}>Cancel</SecondaryButton>
            <PrimaryButton onClick={() => setLogoutModal(2)} style={{ flex: 1 }}>Continue</PrimaryButton>
          </div>
        </ModalOverlay>
      )}

      {logoutModal === 2 && (
        <ModalOverlay onClose={() => setLogoutModal(0)} width={380}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--accent-soft)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="var(--accent)" strokeWidth="1.8" /><line x1="12" y1="8" x2="12" y2="13" stroke="var(--accent)" strokeWidth="1.8" strokeLinecap="round" /><circle cx="12" cy="16.3" r="1" fill="var(--accent)" /></svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 6 }}>Are you sure?</div>
          <div style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.5, marginBottom: 20 }}>This ends your session on this device now.</div>
          <div style={{ display: "flex", gap: 8 }}>
            <SecondaryButton onClick={() => setLogoutModal(0)} style={{ flex: 1 }}>Cancel</SecondaryButton>
            <PrimaryButton onClick={handleLogout} style={{ flex: 1, opacity: loggingOut ? 0.6 : 1 }}>Yes, log out</PrimaryButton>
          </div>
        </ModalOverlay>
      )}
    </div>
  );
}
