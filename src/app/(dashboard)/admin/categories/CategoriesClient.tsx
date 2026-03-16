"use client";

import { useState, useActionState } from "react";
import { Category } from "@/features/admin/categories/queries";
import { createCategory, toggleCategoryActive } from "@/features/admin/categories/actions";
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
import { Plus, Tag } from "lucide-react";

const typeLabels: Record<string, string> = {
  rct: "Recette",
  cv: "Charge variable",
  cf: "Charge fixe",
  all: "Tous",
};

const typeVariants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  rct: "default",
  cv: "secondary",
  cf: "destructive",
  all: "outline",
};

interface Props {
  categories: Category[];
}

function CreateCategoryDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, isPending] = useActionState(createCategory, null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle catégorie
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Créer une catégorie</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom</Label>
            <Input id="name" name="name" placeholder="Vente" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select name="type" id="type" className="w-full border border-input rounded-md px-3 py-2 text-sm bg-background" defaultValue="rct">
              <option value="rct">Recette</option>
              <option value="cv">Charge variable</option>
              <option value="cf">Charge fixe</option>
              <option value="all">Tous</option>
            </select>
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          {state?.success && <p className="text-sm text-[var(--logo-secondary)]">Catégorie créée avec succès</p>}
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

export function CategoriesClient({ categories }: Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold">Catégories ({categories.length})</h2>
        </div>
        <CreateCategoryDialog />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                  Aucune catégorie
                </TableCell>
              </TableRow>
            )}
            {categories.map(cat => (
              <TableRow key={cat.id}>
                <TableCell className="font-medium">{cat.name}</TableCell>
                <TableCell>
                  <Badge variant={typeVariants[cat.type] ?? "outline"}>
                    {typeLabels[cat.type] ?? cat.type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={cat.is_active ? "default" : "secondary"}>
                    {cat.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <form action={toggleCategoryActive.bind(null, cat.id)}>
                    <Button type="submit" variant="ghost" size="sm">
                      {cat.is_active ? "Désactiver" : "Activer"}
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

