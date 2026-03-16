"use client";

import { useState, useActionState } from "react";
import { Alert, AlertLog } from "@/features/alerts/queries";
import { Location } from "@/features/admin/locations/queries";
import { createAlert, toggleAlertActive, deleteAlert } from "@/features/alerts/actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Bell, Trash2 } from "lucide-react";

const typeLabels: Record<string, string> = {
  budget_exceeded: "Budget dépassé",
  low_balance: "Solde faible",
  custom: "Personnalisé",
};

const periodLabels: Record<string, string> = {
  daily: "Quotidien",
  weekly: "Hebdomadaire",
  monthly: "Mensuel",
};

interface Props {
  alerts: Alert[];
  logs: AlertLog[];
  locations: Location[];
}

function CreateAlertDialog({ locations }: { locations: Location[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createAlert, null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter une alerte
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une alerte</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="alert-name">Nom</Label>
            <Input id="alert-name" name="name" placeholder="Alerte budget mensuel" required />
            {state?.fieldErrors?.name && <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="alert-type">Type</Label>
            <select name="type" id="alert-type" className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background" defaultValue="budget_exceeded">
              <option value="budget_exceeded">Budget dépassé</option>
              <option value="low_balance">Solde faible</option>
              <option value="custom">Personnalisé</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="alert-location">Caisse (optionnel)</Label>
            <select name="location_id" id="alert-location" className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background" defaultValue="">
              <option value="">Toutes les caisses</option>
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="alert-threshold">Seuil (MAD)</Label>
            <Input id="alert-threshold" name="threshold" type="number" min="1" step="0.01" placeholder="10000" required />
            {state?.fieldErrors?.threshold && <p className="text-xs text-destructive">{state.fieldErrors.threshold[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="alert-period">Période</Label>
            <select name="period" id="alert-period" className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background" defaultValue="monthly">
              <option value="daily">Quotidien</option>
              <option value="weekly">Hebdomadaire</option>
              <option value="monthly">Mensuel</option>
            </select>
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state?.success && <p className="text-sm text-[var(--logo-secondary)]">Alerte créée avec succès</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Création..." : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AlertsClient({ alerts, logs, locations }: Props) {
  return (
    <div className="space-y-8">
      {/* Alert Rules */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Règles d&apos;alerte ({alerts.length})</h2>
          </div>
          <CreateAlertDialog locations={locations} />
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Caisse</TableHead>
                <TableHead>Seuil</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Aucune alerte configurée
                  </TableCell>
                </TableRow>
              )}
              {alerts.map(alert => (
                <TableRow key={alert.id}>
                  <TableCell className="font-medium">{alert.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{typeLabels[alert.type] ?? alert.type}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {alert.location_name ?? "Toutes"}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {Number(alert.threshold).toLocaleString("fr-MA")} MAD
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{periodLabels[alert.period] ?? alert.period}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={alert.is_active ? "default" : "secondary"}>
                      {alert.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <form action={toggleAlertActive.bind(null, alert.id)}>
                        <Button type="submit" variant="ghost" size="sm">
                          {alert.is_active ? "Désactiver" : "Activer"}
                        </Button>
                      </form>
                      <form action={deleteAlert.bind(null, alert.id)}>
                        <Button type="submit" variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Recent Alert Triggers */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Déclenchements récents</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alerte</TableHead>
                <TableHead>Valeur déclenchée</TableHead>
                <TableHead>Seuil</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    Aucun déclenchement enregistré
                  </TableCell>
                </TableRow>
              )}
              {logs.map(log => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.alert_name}</TableCell>
                  <TableCell className="font-mono text-sm text-destructive">
                    {Number(log.triggered_value).toLocaleString("fr-MA")} MAD
                  </TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {Number(log.threshold).toLocaleString("fr-MA")} MAD
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(log.triggered_at).toLocaleString("fr-MA")}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

