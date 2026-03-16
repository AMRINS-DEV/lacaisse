"use client";

import { useActionState, useState } from "react";
import { Building2, Plus } from "lucide-react";
import { createService, toggleServiceActive } from "@/features/admin/services/actions";
import type { ServiceOption } from "@/features/admin/services/queries";
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

interface Props {
  services: ServiceOption[];
}

function CreateServiceDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createService, null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau service
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter un service</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="service_key">Cle technique</Label>
            <Input
              id="service_key"
              name="service_key"
              placeholder="ex: bscompta2"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nom du service</Label>
            <Input
              id="name"
              name="name"
              placeholder="ex: BSCompta 2"
              required
            />
          </div>
          {state?.error ? (
            <p className="text-sm text-destructive">{state.error}</p>
          ) : null}
          {state?.success ? (
            <p className="text-sm text-emerald-600">Service ajouté avec succes</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Ajout..." : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ServicesClient({ services }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Services ({services.length})</h2>
        </div>
        <CreateServiceDialog />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Service</TableHead>
              <TableHead>Cle</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Aucun service
                </TableCell>
              </TableRow>
            ) : null}
            {services.map((service) => (
              <TableRow key={service.id}>
                <TableCell className="font-medium">{service.label}</TableCell>
                <TableCell>{service.key}</TableCell>
                <TableCell>
                  <Badge variant={service.is_active ? "default" : "secondary"}>
                    {service.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <form action={toggleServiceActive.bind(null, service.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      {service.is_active ? "Desactiver" : "Activer"}
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
