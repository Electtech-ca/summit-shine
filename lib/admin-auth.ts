import { auth } from "@/auth";
import type { Role } from "@prisma/client";

export async function requireAdminSession(): Promise<
  { ok: true; userId: string; role: Role } | { ok: false; status: number; error: string }
> {
  const session = await auth();
  if (!session?.user) return { ok: false, status: 401, error: "Unauthorized" };
  if (session.user.role !== "ADMIN" && session.user.role !== "STAFF") {
    return { ok: false, status: 403, error: "Forbidden" };
  }
  return { ok: true, userId: session.user.id, role: session.user.role };
}
