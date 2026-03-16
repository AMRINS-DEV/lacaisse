"use client";

import { useState, useActionState } from "react";
import { Location } from "@/features/admin/locations/queries";
import { createLocation, updateLocation, toggleLocationActive } from "@/features/admin/locations/actions";
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
import { Plus, MapPin } from "lucide-react";

interface Props {
  locations: Location[];
}

function CreateLocationDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createLocation, null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle caisse
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une caisse</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input id="code" name="code" placeholder="c1" maxLength={10} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" name="name" placeholder="Caisse 1" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Couleur</Label>
            <div className="flex items-center gap-2">
              <input type="color" id="color" name="color" defaultValue="#104eee" className="h-9 w-14 rounded border border-input cursor-pointer" />
              <span className="text-sm text-muted-foreground">Choisir une couleur</span>
            </div>
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state?.success && <p className="text-sm text-[var(--logo-secondary)]">Caisse créée avec succès</p>}
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

function EditLocationDialog({ location }: { location: Location }) {
  const [open, setOpen] = useState(false);
  const boundAction = updateLocation.bind(null, location.id);
  const [state, formAction, isPending] = useActionState(boundAction, null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Modifier</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier {location.name}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={`code-${location.id}`}>Code</Label>
            <Input id={`code-${location.id}`} name="code" defaultValue={location.code} maxLength={10} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`name-${location.id}`}>Nom</Label>
            <Input id={`name-${location.id}`} name="name" defaultValue={location.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`color-${location.id}`}>Couleur</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                id={`color-${location.id}`}
                name="color"
                defaultValue={location.color}
                className="h-9 w-14 rounded border border-input cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">Choisir une couleur</span>
            </div>
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state?.success && <p className="text-sm text-[var(--logo-secondary)]">Caisse mise à jour</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function LocationsClient({ locations }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Caisses ({locations.length})</h2>
        </div>
        <CreateLocationDialog />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Couleur</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {locations.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Aucune caisse
                </TableCell>
              </TableRow>
            )}
            {locations.map(loc => (
              <TableRow key={loc.id}>
                <TableCell className="font-mono text-sm">{loc.code}</TableCell>
                <TableCell className="font-medium">{loc.name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-4 h-4 rounded-full border border-border"
                      style={{ backgroundColor: loc.color }}
                    />
                    <span className="text-xs text-muted-foreground font-mono">{loc.color}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={loc.is_active ? "default" : "secondary"}>
                    {loc.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <EditLocationDialog location={loc} />
                    <form action={toggleLocationActive.bind(null, loc.id)}>
                      <Button type="submit" variant="ghost" size="sm">
                        {loc.is_active ? "Désactiver" : "Activer"}
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
  );
}


