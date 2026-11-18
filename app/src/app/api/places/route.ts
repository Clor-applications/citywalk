import { errorResponse } from "@/lib/errors";
import { getArea, listPlaces } from "@/lib/places";

const AREA_ID = "hsr";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.slice(0, 120) || undefined;
    const kind = url.searchParams.get("kind")?.slice(0, 40) || undefined;

    const [area, places] = await Promise.all([getArea(AREA_ID), listPlaces(AREA_ID, { q, kind })]);
    if (!area) return Response.json({ error: { code: "not_found", message: "Area not found" } }, { status: 404 });

    return Response.json({ area, places });
  } catch (err) {
    return errorResponse(err);
  }
}
