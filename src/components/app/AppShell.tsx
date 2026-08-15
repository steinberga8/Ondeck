"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { useTheme } from "@/components/providers/ThemeProvider";
import { LogoMark } from "@/components/icons";
import type { SafeUser } from "@/lib/serialize";
import { useTrialDaysLeft } from "@/lib/useTrialDaysLeft";

const NAV_ITEMS = [
  {
    href: "/app",
    label: "Homepage",
    match: (p: string) => p === "/app",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="6" height="16" rx="1.5" fill="currentColor" opacity="0.9" />
        <rect x="10.5" y="4" width="6" height="10" rx="1.5" fill="currentColor" opacity="0.9" />
        <rect x="18" y="4" width="6" height="7" rx="1.5" fill="currentColor" opacity="0.9" />
      </svg>
    ),
  },
  {
    href: "/app/table",
    label: "Table",
    match: (p: string) => p.startsWith("/app/table"),
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.6" />
        <line x1="9" y1="4" x2="9" y2="20" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    href: "/app/analytics",
    label: "Analytics",
    match: (p: string) => p.startsWith("/app/analytics"),
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="12" width="4.5" height="8" rx="1" fill="currentColor" />
        <rect x="10" y="7" width="4.5" height="13" rx="1" fill="currentColor" />
        <rect x="16" y="3" width="4.5" height="17" rx="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    href: "/app/ats",
    label: "ATS Breakdown",
    match: (p: string) => p.startsWith("/app/ats"),
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    href: "/app/cv-builder",
    label: "CV Builder",
    match: (p: string) => p.startsWith("/app/cv-builder"),
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <path d="M15 3v4h4" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        <line x1="8.5" y1="12" x2="15.5" y2="12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <line x1="8.5" y1="16" x2="13" y2="16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    ),
  },
];

const TITLES: Record<string, string> = {
  "/app": "Homepage",
  "/app/table": "All Applications",
  "/app/analytics": "Analytics",
  "/app/ats": "ATS Breakdown",
  "/app/cv-builder": "CV Builder",
  "/app/profile": "Profile & Settings",
  "/app/manager": "Manager Dashboard",
};

function titleFor(pathname: string) {
  if (TITLES[pathname]) return TITLES[pathname];
  if (pathname.startsWith("/app/applications/")) return "Application";
  return "Ondeck";
}

function initials(name: string) {
  return name
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function AppShell({ user, children }: { user: SafeUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const trialDaysLeft = useTrialDaysLeft(user.trialStartedAt);
  const trialActive = trialDaysLeft > 0 && !user.subscribed;

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.push("/");
  }

  const themeBtn = (t: "dark" | "light" | "mixed", label: string) => (
    <div
      key={t}
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
    <div style={{ height: "100vh", width: "100%", display: "flex", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-ui)", overflow: "hidden" }}>
      <div style={{ width: 232, flex: "none", display: "flex", flexDirection: "column", background: "var(--sb-bg)", borderRight: "1px solid var(--sb-border)", padding: "20px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, padding: "4px 8px 22px" }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--sb-accent)", display: "flex", alignItems: "center", justifyContent: "center", flex: "none" }}>
            <LogoMark />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontWeight: 400, fontSize: 20, letterSpacing: "-0.01em", color: "var(--sb-text)" }}>Ondeck</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: active ? "var(--sb-accent-soft)" : "transparent",
                  color: active ? "var(--sb-accent)" : "var(--sb-text-dim)",
                  textDecoration: "none",
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
          {user.role === "admin" && (
            <Link
              href="/app/manager"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "9px 12px",
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                background: pathname.startsWith("/app/manager") ? "var(--sb-accent-soft)" : "transparent",
                color: pathname.startsWith("/app/manager") ? "var(--sb-accent)" : "var(--sb-text-dim)",
                textDecoration: "none",
                marginTop: 6,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 3l8 4v5c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V7l8-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              </svg>
              <span>Manager</span>
            </Link>
          )}
        </div>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 8, background: "var(--sb-surface)", border: "1px solid var(--sb-border-soft)" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: user.linkedinSynced ? "var(--green)" : "var(--sb-text-faint)", flex: "none" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--sb-text)" }}>LinkedIn</div>
              <div style={{ fontSize: 10.5, color: "var(--sb-text-faint)", fontFamily: "var(--font-mono)" }}>{user.linkedinSynced ? "synced" : "not connected"}</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 10px", borderRadius: 8, background: "var(--sb-surface)", border: "1px solid var(--sb-border-soft)" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: user.mailSynced ? "var(--green)" : "var(--sb-text-faint)", flex: "none" }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--sb-text)" }}>Mail updates</div>
              <div style={{ fontSize: 10.5, color: "var(--sb-text-faint)", fontFamily: "var(--font-mono)" }}>{user.mailSynced ? "synced" : "not connected"}</div>
            </div>
          </div>
          {trialActive && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 10px", marginTop: 8, fontSize: 10.5, fontWeight: 700, color: trialDaysLeft <= 3 ? "var(--amber)" : "var(--text-faint)" }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
                <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              {trialDaysLeft} {trialDaysLeft === 1 ? "day" : "days"} left in trial
            </div>
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: 8,
              borderRadius: 8,
              background: pathname.startsWith("/app/profile") ? "var(--sb-surface)" : "transparent",
            }}
          >
            <Link href="/app/profile" style={{ display: "flex", alignItems: "center", gap: 9, flex: 1, minWidth: 0, textDecoration: "none" }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: "var(--sb-surface3)", flex: "none", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "var(--sb-text-dim)" }}>
                {initials(user.username)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, color: "var(--sb-text)", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.username}</div>
                <div style={{ fontSize: 10, color: "var(--sb-text-faint)" }}>Profile &amp; settings</div>
              </div>
            </Link>
            <div onClick={handleLogout} title="Log out" style={{ width: 24, height: 24, borderRadius: 6, flex: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: loggingOut ? "default" : "pointer", opacity: loggingOut ? 0.5 : 1 }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="var(--sb-text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M16 17L21 12L16 7" stroke="var(--sb-text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="21" y1="12" x2="9" y2="12" stroke="var(--sb-text-faint)" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, padding: "15px 28px", borderBottom: "1px solid var(--border)", flex: "none" }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 400, fontSize: 26, letterSpacing: "-0.01em" }}>{titleFor(pathname)}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", gap: 2, background: "var(--surface2)", border: "1px solid var(--border-soft)", borderRadius: 8, padding: 3 }}>
              {themeBtn("dark", "Dark")}
              {themeBtn("light", "Light")}
              {themeBtn("mixed", "Mixed")}
            </div>
          </div>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: "auto", position: "relative" }}>{children}</div>
      </div>
    </div>
  );
}
