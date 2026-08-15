"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import type { SafeUser } from "@/lib/serialize";
import { GoogleGlyph } from "@/components/icons";

const STORAGE_KEY = "ondeck_google_client_id";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (resp: { credential: string }) => void; auto_select?: boolean }) => void;
          renderButton: (el: HTMLElement, opts: { theme: string; size: string; width: number; text: string }) => void;
        };
      };
    };
  }
}

export function GoogleButton({
  keepLoggedIn,
  label = "Google",
  onSuccess,
  onError,
}: {
  keepLoggedIn: boolean;
  label?: string;
  onSuccess: (user: SafeUser, isNew: boolean) => void;
  onError: (msg: string) => void;
}) {
  const [clientId, setClientId] = useState("");
  const [setupOpen, setSetupOpen] = useState(false);
  const [clientIdInput, setClientIdInput] = useState("");
  const [scriptReady, setScriptReady] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);
  const renderedForRef = useRef<string | null>(null);

  useEffect(() => {
    // Reading localStorage to sync in a persisted Client ID on mount — an
    // external-store read, not derivable during render.
    const stored = localStorage.getItem(STORAGE_KEY);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (stored) setClientId(stored);
  }, []);

  const handleCredential = async (response: { credential: string }) => {
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential, clientId, keepLoggedIn }),
      });
      const data = await res.json();
      if (!res.ok) {
        onError(data.error ?? "Google sign-in failed.");
        return;
      }
      onSuccess(data.user, data.isNew);
    } catch {
      onError("Google sign-in failed — network error.");
    }
  };

  useEffect(() => {
    if (!clientId || !scriptReady || !btnRef.current || renderedForRef.current === clientId) return;
    if (!window.google) return;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
      auto_select: false,
    });
    window.google.accounts.id.renderButton(btnRef.current, {
      theme: "outline",
      size: "large",
      width: 260,
      text: "continue_with",
    });
    renderedForRef.current = clientId;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, scriptReady]);

  const saveClientId = () => {
    const id = clientIdInput.trim();
    if (!id) return;
    localStorage.setItem(STORAGE_KEY, id);
    renderedForRef.current = null;
    setClientId(id);
    setSetupOpen(false);
  };

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setScriptReady(true)} />
      {clientId ? (
        <div ref={btnRef} style={{ width: "100%" }} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div
            onClick={() => setSetupOpen((v) => !v)}
            style={{
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
            <GoogleGlyph size={15} />
            <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--text)" }}>{label}</span>
          </div>
          {setupOpen && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                padding: 10,
                background: "oklch(0 0 0 / 0.2)",
                border: "1px solid var(--border)",
                borderRadius: 9,
              }}
            >
              <div style={{ fontSize: 10.5, color: "var(--text-dim)", lineHeight: 1.5 }}>
                Paste a Google OAuth Client ID (from{" "}
                <span style={{ color: "var(--accent)", fontWeight: 700 }}>Google Cloud Console → Credentials</span>) to enable real sign-in.
              </div>
              <input
                value={clientIdInput}
                onChange={(e) => setClientIdInput(e.target.value)}
                placeholder="xxxx.apps.googleusercontent.com"
                style={{
                  width: "100%",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "8px 10px",
                  color: "var(--text)",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  outline: "none",
                }}
              />
              <div
                onClick={saveClientId}
                style={{
                  textAlign: "center",
                  background: "var(--accent)",
                  color: "var(--on-accent)",
                  fontWeight: 700,
                  fontSize: 11.5,
                  padding: 8,
                  borderRadius: 7,
                  cursor: "pointer",
                }}
              >
                Enable Google sign-in
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
