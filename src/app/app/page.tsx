import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getUserAppsAndStages } from "@/lib/app-data-server";
import { KanbanView } from "@/components/kanban/KanbanView";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  const initial = await getUserAppsAndStages(user.id);
  return <KanbanView initial={initial} />;
}
