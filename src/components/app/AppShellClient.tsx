"use client";

import { useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { AppShell } from "@/components/app/AppShell";
import { PreviewProvider } from "@/components/files/FilePreview";
import type { SafeUser } from "@/lib/serialize";

export function AppShellClient({ user, children }: { user: SafeUser; children: React.ReactNode }) {
  const { user: liveUser, setUser } = useAuth();

  // Seed the client-side auth context from the server-fetched user so pages
  // reading useAuth() don't see a flash of null before the client refetch lands.
  useEffect(() => {
    setUser(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  return (
    <PreviewProvider>
      <AppShell user={liveUser ?? user}>{children}</AppShell>
    </PreviewProvider>
  );
}
