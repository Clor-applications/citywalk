import { eq } from "drizzle-orm";
import { db } from "@/db";
import { areas, profiles } from "@/db/schema";
import { getProfile, getSession } from "@/lib/auth";
import { AppError, errorResponse } from "@/lib/errors";
import { profileSchema } from "@/lib/validation";

export async function GET() {
  try {
    const user = await getSession();
    if (!user) throw new AppError(401, "unauthorized", "Sign in first");
    const profile = await getProfile(user.id);
    return Response.json({ user, profile });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await getSession();
    if (!user) throw new AppError(401, "unauthorized", "Sign in first");

    const parsed = profileSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return Response.json(
        { error: { code: "invalid", message: parsed.error.issues[0]?.message ?? "Check the form", details: parsed.error.flatten() } },
        { status: 400 },
      );
    }

    const [area] = await db.select({ id: areas.id }).from(areas).where(eq(areas.id, parsed.data.areaId)).limit(1);
    if (!area) throw new AppError(400, "invalid", "Choose a supported area");

    const [profile] = await db
      .insert(profiles)
      .values({ userId: user.id, ...parsed.data })
      .onConflictDoUpdate({
        target: profiles.userId,
        set: { ...parsed.data, updatedAt: new Date() },
      })
      .returning();

    return Response.json({ profile });
  } catch (err) {
    return errorResponse(err);
  }
}
