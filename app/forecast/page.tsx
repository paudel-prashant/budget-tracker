import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ForecastView } from "@/components/forecast/forecast-view";
import { getCashFlowForecast } from "@/lib/data/forecast-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function ForecastPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect("/login");
  }

  const initialForecast = await getCashFlowForecast(userId, "30d");

  return <ForecastView initialForecast={initialForecast} />;
}
