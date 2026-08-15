import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getUserAppsAndStages } from "@/lib/app-data-server";
import { TableView } from "@/components/table/TableView";

export default async function Page() {
  const user = await getSessionUser();
  if (!user) redirect("/");
  const initial = await getUserAppsAndStages(user.id);
  return <TableView initial={initial} />;
}
