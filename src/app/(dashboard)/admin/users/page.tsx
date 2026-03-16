import { requireRole } from "@/lib/auth/permissions";
import { getAdminUsers } from "@/features/admin/users/queries";
import { getLocations } from "@/features/admin/locations/queries";
import { UsersClient } from "./UsersClient";

export default async function UsersPage() {
  await requireRole("admin");
  const [users, locations] = await Promise.all([
    getAdminUsers(),
    getLocations(false),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gérez les comptes utilisateurs et leurs accès aux caisses
        </p>
      </div>
      <UsersClient users={users} locations={locations} />
    </div>
  );
}
