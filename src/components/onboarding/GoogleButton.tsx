"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import type { SafeUser } from "@/lib/serialize";

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

// Set once by the site owner (Vercel → Settings → Environment Variables →
// NEXT_PUBLIC_GOOGLE_CLIENT_ID). Client IDs are public identifiers, not secrets,
// so it's safe to expose to the browser — that's what NEXT_PUBLIC_ is for.
// Every visitor gets a working button automatically; nobody is ever asked to
// paste anything in.
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function GoogleButton({
  keepLoggedIn,
  onSuccess,
  onError,
}: {
  keepLoggedIn: boolean;
  onSuccess: (user: SafeUser, isNew: boolean) => void;
  onError: (msg: string) => void;
}) {
  const [scriptReady, setScriptReady] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);

  const handleCredential = async (response: { credential: string }) => {
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential, clientId: GOOGLE_CLIENT_ID, keepLoggedIn }),
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
    if (!GOOGLE_CLIENT_ID || !scriptReady || !btnRef.current || renderedRef.current) return;
    if (!window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredential,
      auto_select: false,
    });
    window.google.accounts.id.renderButton(btnRef.current, {
      theme: "outline",
      size: "large",
      width: 260,
      text: "continue_with",
    });
    renderedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scriptReady]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setScriptReady(true)} />
      <div ref={btnRef} style={{ width: "100%" }} />
    </>
  );
}
