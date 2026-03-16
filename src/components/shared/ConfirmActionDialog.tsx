"use client";

import { AlertTriangle, Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ConfirmActionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  isPending?: boolean;
};

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Supprimer",
  cancelLabel = "Annuler",
  onConfirm,
  isPending = false,
}: ConfirmActionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !isPending && onOpenChange(nextOpen)}>
      <DialogContent
        showCloseButton={false}
        className="overflow-hidden rounded-3xl border border-rose-200/70 bg-white/96 p-0 shadow-[0_24px_80px_-40px_rgba(225,29,72,0.45)] dark:border-rose-500/20 dark:bg-slate-950/96"
      >
        <div className="relative">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,63,94,0.16),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(251,191,36,0.14),transparent_45%)]" />
          <div className="relative p-6">
            <div className="mb-5 flex items-start gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-rose-200/80 bg-rose-50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <DialogHeader className="gap-2 text-left">
                <DialogTitle className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                  {title}
                </DialogTitle>
                <DialogDescription className="text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {description}
                </DialogDescription>
                <p className="inline-flex w-fit items-center gap-2 rounded-full border border-rose-200/80 bg-rose-50/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-300">
                  <Trash2 className="h-3.5 w-3.5" />
                  Action irreversible
                </p>
              </DialogHeader>
            </div>

            <DialogFooter className="gap-2 sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
                className="rounded-xl"
              >
                {cancelLabel}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void onConfirm()}
                disabled={isPending}
                className="min-w-[132px] rounded-xl"
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    {confirmLabel}
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
