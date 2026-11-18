import { destroySession } from "@/lib/auth";
import { errorResponse } from "@/lib/errors";

export async function POST() {
  try {
    await destroySession();
    return Response.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
