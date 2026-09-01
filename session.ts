import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return { session: null, error: "Unauthorized" as const };
  }
  return { session, error: null };
}

const ADMIN_ROLES = new Set(["ADMIN", "OWNER"]);
const STAFF_ROLES = new Set(["SUPPORT", "ADMIN", "OWNER"]);

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !ADMIN_ROLES.has(role)) {
    return { session: null, error: "Forbidden" as const };
  }
  return { session, error: null };
}

export async function requireStaff() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  if (!session?.user || !STAFF_ROLES.has(role)) {
    return { session: null, error: "Forbidden" as const };
  }
  return { session, error: null };
}
