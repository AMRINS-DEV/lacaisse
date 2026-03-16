import { requireRole } from "@/lib/auth/permissions";
import { getLocations } from "@/features/admin/locations/queries";
import { LocationsClient } from "./LocationsClient";

export default async function LocationsPage() {
  await requireRole("admin");
  const locations = await getLocations(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion des caisses</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Gérez les points de caisse et leurs paramètres
        </p>
      </div>
      <LocationsClient locations={locations} />
    </div>
  );
}
