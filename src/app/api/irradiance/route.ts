import { getForecast, getTypicalDay } from "@/lib/open-meteo";
import { lahoreNow } from "@/lib/format";
import { ORIENTATIONS } from "@/lib/solar";

const badRequest = (error: string) => Response.json({ error }, { status: 400 });

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const mode = params.get("mode") ?? "forecast";
  const tilt = Number(params.get("tilt") ?? 30);
  const azimuth = Number(params.get("azimuth") ?? 0);

  if (mode !== "forecast" && mode !== "typical") return badRequest("mode must be forecast or typical");
  if (!Number.isInteger(tilt) || tilt < 0 || tilt > 60) return badRequest("tilt must be an integer 0–60");
  if (!ORIENTATIONS.some((o) => o.azimuth === azimuth)) return badRequest("azimuth must be -90, -45, 0, 45 or 90");

  try {
    if (mode === "forecast") {
      return Response.json(await getForecast(tilt, azimuth), {
        headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
      });
    }

    const month = Number(params.get("month"));
    if (!Number.isInteger(month) || month < 1 || month > 12) return badRequest("month must be 1–12");
    // Use the most recent complete occurrence of that month.
    const now = lahoreNow();
    const year = month < now.month ? Number(now.date.slice(0, 4)) : Number(now.date.slice(0, 4)) - 1;
    return Response.json(await getTypicalDay(tilt, azimuth, month, year), {
      headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" },
    });
  } catch (error) {
    console.error("irradiance fetch failed", error);
    return Response.json(
      { error: "Couldn't reach the Open-Meteo solar data service. Please try again in a moment." },
      { status: 502 },
    );
  }
}
