import { clearSessionCookie } from "@/lib/auth/session";
import { ok } from "@/lib/utils/errors";

export async function POST() {
  await clearSessionCookie();
  return ok({ loggedOut: true });
}
