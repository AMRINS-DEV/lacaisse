import { auth } from "@/auth";
import { redirect } from "next/navigation";

export type Role = "admin" | "manager" | "location_user";

const roleHierarchy: Record<Role, number> = {
  admin: 3,
  manager: 2,
  location_user: 1,
};

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export async function requireRole(minRole: Role) {
  const session = await requireAuth();
  const userRole = (session.user as any).role as Role;
  if ((roleHierarchy[userRole] ?? 0) < roleHierarchy[minRole]) {
    redirect("/unauthorized");
  }
  return session;
}

export async function getCurrentUserId(): Promise<number> {
  const session = await requireAuth();
  return parseInt((session.user as any).id as string);
}

export async function getCurrentRole(): Promise<Role> {
  const session = await requireAuth();
  return (session.user as any).role as Role;
}
