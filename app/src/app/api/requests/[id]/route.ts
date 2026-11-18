import { getSession } from "@/lib/auth";
import { AppError, errorResponse } from "@/lib/errors";
import { transitionRequest } from "@/lib/requests";
import { transitionRequestSchema } from "@/lib/validation";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    const user = await getSession();
    if (!user) throw new AppError(401, "unauthorized", "Sign in first");

    const { id } = await ctx.params;
    const parsed = transitionRequestSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return Response.json({ error: { code: "invalid", message: "Unknown action" } }, { status: 400 });
    }

    const updated = await transitionRequest(id, user.id, parsed.data.action, parsed.data.note);
    return Response.json(updated);
  } catch (err) {
    return errorResponse(err);
  }
}
