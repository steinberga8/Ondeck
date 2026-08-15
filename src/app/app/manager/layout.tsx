import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  // Belt-and-suspenders: the (app) layout above already requires a session,
  // this additionally requires the admin role — server-side, not just a
  // hidden nav link — since this dashboard exposes aggregate business data.
  if (!user || user.role !== "admin") redirect("/app");

  return <>{children}</>;
}
