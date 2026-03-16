import { requireRole } from "@/lib/auth/permissions";
import { getAlerts, getRecentAlertLogs } from "@/features/alerts/queries";
import { getLocations } from "@/features/admin/locations/queries";
import { AlertsClient } from "./AlertsClient";

export default async function AlertsPage() {
  await requireRole("manager");
  const [alerts, logs, locations] = await Promise.all([
    getAlerts(),
    getRecentAlertLogs(20),
    getLocations(true),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gestion des alertes</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configurez les alertes et consultez l&apos;historique des déclenchements
        </p>
      </div>
      <AlertsClient alerts={alerts} logs={logs} locations={locations} />
    </div>
  );
}
