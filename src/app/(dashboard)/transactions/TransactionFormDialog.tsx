"use client";

import { useEffect, useActionState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createTransaction } from "@/features/transactions/actions";
import type { Location } from "@/features/admin/locations/queries";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  locations: Location[];
}

export function TransactionFormDialog({ open, onOpenChange, locations }: Props) {
  const [state, formAction, isPending] = useActionState(createTransaction, null);

  useEffect(() => {
    if (state?.success) {
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau virement</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label>Caisse source</Label>
            <Select name="from_location_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Choisir la caisse source" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.from_location_id && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.from_location_id[0]}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Caisse destination</Label>
            <Select name="to_location_id" required>
              <SelectTrigger>
                <SelectValue placeholder="Choisir la caisse destination" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((l) => (
                  <SelectItem key={l.id} value={String(l.id)}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {state?.fieldErrors?.to_location_id && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.to_location_id[0]}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Montant (MAD)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
              />
              {state?.fieldErrors?.amount && (
                <p className="text-xs text-destructive">{state.fieldErrors.amount[0]}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={new Date().toISOString().split("T")[0]}
                required
              />
              {state?.fieldErrors?.date && (
                <p className="text-xs text-destructive">{state.fieldErrors.date[0]}</p>
              )}
            </div>
          </div>

          {state?.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enregistrement..." : "Ajouter"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
