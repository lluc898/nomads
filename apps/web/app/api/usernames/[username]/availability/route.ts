import { isUsernameAvailable } from "@viajeroshub/database";
import { usernameSchema } from "@viajeroshub/shared";

import { getDatabase } from "@/lib/database";

type RouteContext = {
  params: Promise<{ username: string }>;
};

export async function GET(_request: Request, { params }: RouteContext) {
  const result = usernameSchema.safeParse((await params).username);

  if (!result.success) {
    return Response.json({ available: false, valid: false }, { status: 400 });
  }

  return Response.json({
    available: await isUsernameAvailable(getDatabase(), result.data),
    valid: true,
  });
}
