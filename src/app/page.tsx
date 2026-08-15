import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard";

export default async function Home() {
  const user = await getSessionUser();
  if (user) redirect("/app");

  return (
    <div
      style={{
        height: "100vh",
        width: "100%",
        display: "flex",
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font-ui)",
        overflow: "hidden",
      }}
    >
      <OnboardingWizard />
    </div>
  );
}
