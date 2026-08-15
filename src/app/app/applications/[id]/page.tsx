import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { getUserAppsAndStages } from "@/lib/app-data-server";
import { DetailView } from "@/components/detail/DetailView";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) redirect("/");
  const { id } = await params;
  const initial = await getUserAppsAndStages(user.id);
  return <DetailView id={id} initial={initial} />;
}
