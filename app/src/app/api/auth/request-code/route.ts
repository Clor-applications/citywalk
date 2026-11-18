import { issueLoginCode } from "@/lib/auth";
import { errorResponse } from "@/lib/errors";
import { requestCodeSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const parsed = requestCodeSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return Response.json({ error: { code: "invalid", message: "Enter a valid email address" } }, { status: 400 });
    }
    const result = await issueLoginCode(parsed.data.email);
    return Response.json(result);
  } catch (err) {
    return errorResponse(err);
  }
}
