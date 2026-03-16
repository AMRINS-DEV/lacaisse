"use client";

import { useEffect, useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Banknote,
  Building2,
  CreditCard,
  Landmark,
  Loader2,
  Pencil,
  PlusCircle,
  ReceiptText,
  Smartphone,
  Tag,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createRecette, updateRecette } from "@/features/recettes/actions";
import type { Recette } from "@/features/recettes/types";
import type { Location } from "@/features/admin/locations/queries";
import type { Category } from "@/features/admin/categories/queries";
import type { PaymentMethod } from "@/features/admin/payment-methods/queries";
import { cn } from "@/lib/utils";
import { AttachmentUploadField } from "./AttachmentUploadField";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recette: Recette | null;
  locations: Location[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  onSaved?: (id: number) => void;
}

export function RecetteFormDialog({
  open,
  onOpenChange,
  recette,
  locations,
  categories,
  paymentMethods,
  onSaved,
}: Props) {
  const router = useRouter();
  const isEdit = !!recette;

  const action = isEdit
    ? updateRecette.bind(null, recette!.id)
    : createRecette;

  const [state, formAction, isPending] = useActionState(action, null);

  useEffect(() => {
    if (state?.success) {
      if (isEdit && recette) {
        onSaved?.(recette.id);
      }
      onOpenChange(false);
      router.refresh();
    }
  }, [state, isEdit, onOpenChange, onSaved, recette, router]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier la recette" : "Nouvelle recette"}
          </DialogTitle>
        </DialogHeader>
        <form key={recette?.id ?? "new"} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <div className="relative">
              <ReceiptText className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <Textarea
                id="description"
                name="description"
                defaultValue={recette?.description ?? ""}
                className="pl-9"
                required
              />
            </div>
            {state?.fieldErrors?.description && (
              <p className="text-xs text-destructive">{state.fieldErrors.description[0]}</p>
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
                defaultValue={recette?.amount ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={recette?.date ?? new Date().toISOString().split("T")[0]}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select name="category" defaultValue={recette?.category ?? ""} required>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choisir une categorie" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name}>
                    <span className="flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5 text-slate-500" />
                      <span>{c.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Mode de paiement</Label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((pm) => {
                const visual = getPaymentVisual(pm.name);
                return (
                  <label
                    key={pm.id}
                    className="group cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={pm.name}
                      defaultChecked={recette?.payment_method === pm.name}
                      required
                      className="peer sr-only"
                    />
                    <span
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition",
                        "border-slate-200/80 bg-white/75 hover:border-slate-300 dark:border-white/10 dark:bg-slate-800/60 dark:hover:border-white/20",
                        "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--logo-primary)]/40",
                        "peer-checked:border-[var(--logo-primary)]/40 peer-checked:bg-[var(--logo-primary)]/10"
                      )}
                    >
                      <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full border", visual.tone)}>
                        <visual.icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="truncate text-xs font-medium text-slate-700 dark:text-slate-200">
                        {formatPaymentLabel(pm.name)}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
            {state?.fieldErrors?.payment_method && (
              <p className="text-xs text-destructive">{state.fieldErrors.payment_method[0]}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Caisse</Label>
            <div className="grid grid-cols-2 gap-2">
              {locations.map((location) => (
                <label key={location.id} className="group cursor-pointer">
                  <input
                    type="radio"
                    name="location_id"
                    value={String(location.id)}
                    defaultChecked={recette?.location_id === location.id}
                    required
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition",
                      "border-slate-200/80 bg-white/75 hover:border-slate-300 dark:border-white/10 dark:bg-slate-800/60 dark:hover:border-white/20",
                      "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--logo-primary)]/40",
                      "peer-checked:border-[var(--logo-primary)]/40 peer-checked:bg-[var(--logo-primary)]/10"
                    )}
                  >
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300">
                      <Building2 className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                        C{location.id}
                      </span>
                      <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {location.name}
                      </span>
                    </span>
                  </span>
                </label>
              ))}
            </div>
            {state?.fieldErrors?.location_id && (
              <p className="text-xs text-destructive">{state.fieldErrors.location_id[0]}</p>
            )}
          </div>

          <AttachmentUploadField
            initialAttachmentId={recette?.attachment_id ?? null}
            initialAttachmentName={recette?.attachment_name ?? null}
            initialAttachmentPath={recette?.attachment_path ?? null}
            initialAttachmentMimeType={recette?.attachment_mime_type ?? null}
          />

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
            <Button
              type="submit"
              disabled={isPending}
              className={cn(
                "group relative overflow-hidden border-0 text-white",
                "bg-gradient-to-r from-[var(--logo-primary)] to-[var(--logo-secondary)]",
                "shadow-[0_10px_24px_-12px_rgba(16,78,238,0.85)] transition-all duration-300",
                "hover:brightness-110 active:scale-[0.99]",
                "disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:scale-100"
              )}
            >
              <span className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_20%,rgba(255,255,255,0.26)_50%,transparent_80%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative z-10 inline-flex items-center gap-2">
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : isEdit ? (
                  <>
                    <Pencil className="h-4 w-4" />
                    Modifier
                  </>
                ) : (
                  <>
                    <PlusCircle className="h-4 w-4" />
                    Ajouter
                  </>
                )}
              </span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type PaymentVisual = {
  icon: LucideIcon;
  tone: string;
};

function normalizePaymentMethod(method: string) {
  return method.trim().toLowerCase();
}

function getPaymentVisual(method: string): PaymentVisual {
  const normalized = normalizePaymentMethod(method);

  if (
    normalized.includes("espece") ||
    normalized.includes("esp ") ||
    normalized.includes("cash") ||
    normalized.includes("liquide")
  ) {
    return { icon: Banknote, tone: "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300" };
  }
  if (
    normalized.includes("virement") ||
    normalized.includes("transfer") ||
    normalized.includes("bank") ||
    normalized.includes("wire")
  ) {
    return { icon: Landmark, tone: "border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300" };
  }
  if (
    normalized.includes("carte") ||
    normalized.includes("card") ||
    normalized.includes("visa") ||
    normalized.includes("mastercard") ||
    normalized.includes("credit") ||
    normalized.includes("debit")
  ) {
    return { icon: CreditCard, tone: "border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300" };
  }
  if (
    normalized.includes("ligne") ||
    normalized.includes("online") ||
    normalized.includes("mobile") ||
    normalized.includes("wallet") ||
    normalized.includes("paypal")
  ) {
    return { icon: Smartphone, tone: "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300" };
  }
  if (normalized.includes("cheque") || normalized.includes("check")) {
    return { icon: ReceiptText, tone: "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300" };
  }

  return { icon: Wallet, tone: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300" };
}

function formatPaymentLabel(method: string) {
  const normalized = normalizePaymentMethod(method);
  if (normalized === "bank_transfer") return "bank";
  return method;
}
