"use client";

import { useState, useActionState } from "react";
import { AdminUser } from "@/features/admin/users/queries";
import { Location } from "@/features/admin/locations/queries";
import { createUser, toggleUserActive, updateUserRole, updateUserLocations } from "@/features/admin/users/actions";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Users } from "lucide-react";

const roleLabels: Record<string, string> = {
  admin: "Admin",
  manager: "Manager",
  location_user: "Utilisateur",
};

const roleVariants: Record<string, "default" | "secondary" | "outline"> = {
  admin: "default",
  manager: "secondary",
  location_user: "outline",
};

interface Props {
  users: AdminUser[];
  locations: Location[];
}

function CreateUserDialog({ locations }: { locations: Location[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createUser, null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvel utilisateur
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer un utilisateur</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" name="name" required />
            {state?.fieldErrors?.name && <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
            {state?.fieldErrors?.email && <p className="text-xs text-destructive">{state.fieldErrors.email[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" name="password" type="password" required />
            {state?.fieldErrors?.password && <p className="text-xs text-destructive">{state.fieldErrors.password[0]}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Rôle</Label>
            <select name="role" id="role" className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background" defaultValue="location_user">
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="location_user">Utilisateur</option>
            </select>
          </div>
          {locations.length > 0 && (
            <div className="space-y-2">
              <Label>Caisses assignées</Label>
              <div className="grid grid-cols-2 gap-2">
                {locations.map(loc => (
                  <label key={loc.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" name="location_ids" value={loc.id} className="rounded" />
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: loc.color }}
                    />
                    {loc.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state?.success && (
            <p className="text-sm text-[var(--logo-secondary)]">Utilisateur créé avec succès</p>
          )}
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

function EditUserDialog({ user, locations }: { user: AdminUser; locations: Location[] }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedRole, setSelectedRole] = useState(user.role);

  async function handleSave() {
    setSaving(true);
    const checkboxes = document.querySelectorAll<HTMLInputElement>(`input[name="edit_loc_${user.id}"]`);
    const locIds = Array.from(checkboxes).filter(c => c.checked).map(c => Number(c.value));
    await updateUserRole(user.id, selectedRole);
    await updateUserLocations(user.id, locIds);
    setSaving(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Modifier</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier {user.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Rôle</Label>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as typeof selectedRole)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="location_user">Utilisateur</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {locations.length > 0 && (
            <div className="space-y-2">
              <Label>Caisses assignées</Label>
              <div className="grid grid-cols-2 gap-2">
                {locations.map(loc => (
                  <label key={loc.id} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      name={`edit_loc_${user.id}`}
                      value={loc.id}
                      className="rounded"
                      defaultChecked={false}
                    />
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ backgroundColor: loc.color }}
                    />
                    {loc.name}
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function UsersClient({ users, locations }: Props) {
  async function handleToggle(userId: number) {
    await toggleUserActive(userId);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Utilisateurs ({users.length})</h2>
        </div>
        <CreateUserDialog locations={locations} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Caisses</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Aucun utilisateur
                </TableCell>
              </TableRow>
            )}
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={roleVariants[user.role] ?? "outline"}>
                    {roleLabels[user.role] ?? user.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">{user.location_count}</span>
                </TableCell>
                <TableCell>
                  <Badge variant={user.is_active ? "default" : "secondary"}>
                    {user.is_active ? "Actif" : "Inactif"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <EditUserDialog user={user} locations={locations} />
                    <form action={handleToggle.bind(null, user.id)}>
                      <Button type="submit" variant="ghost" size="sm">
                        {user.is_active ? "Désactiver" : "Activer"}
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

