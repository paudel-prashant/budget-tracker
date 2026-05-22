import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { InsightsContent } from "@/components/insights/insights-content";
import { getFinancialInsights } from "@/lib/insights-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function InsightsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const insights = await getFinancialInsights(userId);

  return <InsightsContent insights={insights} />;
}
