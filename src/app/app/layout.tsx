import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { toSafeUser } from "@/lib/serialize";
import { AppShellClient } from "@/components/app/AppShellClient";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  if (!user) redirect("/");

  return <AppShellClient user={toSafeUser(user)}>{children}</AppShellClient>;
}
