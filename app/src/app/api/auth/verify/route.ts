import { verifyLoginCode } from "@/lib/auth";
import { errorResponse } from "@/lib/errors";
import { verifyCodeSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const parsed = verifyCodeSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return Response.json(
        { error: { code: "invalid", message: parsed.error.issues[0]?.message ?? "Check the code" } },
        { status: 400 },
      );
    }
    const result = await verifyLoginCode(parsed.data.email, parsed.data.code);
    const next = parsed.data.next && parsed.data.next.startsWith("/") ? parsed.data.next : result.hasProfile ? "/hsr" : "/onboard";
    return Response.json({ ...result, next });
  } catch (err) {
    return errorResponse(err);
  }
}
