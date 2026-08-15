import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getUserAppsAndStages } from "@/lib/app-data-server";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  const initial = await getUserAppsAndStages(user.id);
  return <AnalyticsView initial={initial} />;
}
