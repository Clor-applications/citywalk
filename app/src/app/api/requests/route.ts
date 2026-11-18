import { getProfile, getSession } from "@/lib/auth";
import { AppError, errorResponse } from "@/lib/errors";
import { createRequest, listInbox, listOutbox } from "@/lib/requests";
import { createRequestSchema } from "@/lib/validation";

export async function GET() {
  try {
    const user = await getSession();
    if (!user) throw new AppError(401, "unauthorized", "Sign in first");
    const [outbox, inbox] = await Promise.all([listOutbox(user.id), listInbox(user.id)]);
    return Response.json({ outbox, inbox });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getSession();
    if (!user) throw new AppError(401, "unauthorized", "Sign in first");
    const profile = await getProfile(user.id);
    if (!profile) throw new AppError(409, "profile_required", "Finish your profile before sending requests");

    const parsed = createRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return Response.json(
        { error: { code: "invalid", message: parsed.error.issues[0]?.message ?? "Check the request" } },
        { status: 400 },
      );
    }

    const created = await createRequest(user.id, parsed.data);
    return Response.json({ id: created.id }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
