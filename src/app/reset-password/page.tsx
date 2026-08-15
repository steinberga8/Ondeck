"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogoMark, AlertIcon } from "@/components/icons";
import { FieldLabel, PrimaryButton, TextInput } from "@/components/onboarding/ui";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setDone(true);
  }

  return (
    <div style={{ height: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font-ui)" }}>
      <div style={{ width: 420, maxWidth: "92%" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 24, justifyContent: "center" }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <LogoMark />
          </div>
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic", fontSize: 22 }}>Ondeck</div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 14, padding: "26px 28px" }}>
          {!token ? (
            <div style={{ fontSize: 12.5, color: "var(--text-dim)" }}>This reset link is missing its token. Request a new one from the sign-in page.</div>
          ) : done ? (
            <>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 8 }}>Password updated</div>
              <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginBottom: 18 }}>You can now sign in with your new password.</div>
              <PrimaryButton onClick={() => router.push("/")}>Back to sign in</PrimaryButton>
            </>
          ) : (
            <>
              <div style={{ fontFamily: "var(--font-display)", fontSize: 24, marginBottom: 8 }}>Set a new password</div>
              {error && (
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
                  {error}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                <div>
                  <FieldLabel>NEW PASSWORD</FieldLabel>
                  <TextInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
                </div>
                <div>
                  <FieldLabel>CONFIRM PASSWORD</FieldLabel>
                  <TextInput type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
                </div>
                <PrimaryButton onClick={submit} disabled={busy}>
                  {busy ? "Saving…" : "Save new password"}
                </PrimaryButton>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
