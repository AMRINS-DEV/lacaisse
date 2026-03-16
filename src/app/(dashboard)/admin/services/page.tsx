import { requireRole } from "@/lib/auth/permissions";
import { getServices } from "@/features/admin/services/queries";
import { ServicesClient } from "./ServicesClient";

export default async function ServicesPage() {
  await requireRole("admin");
  const services = await getServices(false);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion des services</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajoutez de nouveaux services et activez/desactivez les services existants.
        </p>
      </div>
      <ServicesClient services={services} />
    </div>
  );
}
