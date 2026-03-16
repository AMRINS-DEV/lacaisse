"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  PlusCircle,
  RotateCcw,
  Send,
  Trash2,
  Wallet,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { SelectionCheckbox } from "@/components/shared/SelectionCheckbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { deleteTransaction, deleteTransactions } from "@/features/transactions/actions";
import type { Transaction } from "@/features/transactions/types";
import type { Location } from "@/features/admin/locations/queries";
import { TransactionFormDialog } from "./TransactionFormDialog";
import { toast } from "sonner";

interface Props {
  transactions: Transaction[];
  locations: Location[];
  currentMonth: number;
  currentYear: number;
}

const MONTHS = [
  "Janvier",
  "Fevrier",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Aout",
  "Septembre",
  "Octobre",
  "Novembre",
  "Decembre",
];

export function TransactionsClient({
  transactions,
  locations,
  currentMonth,
  currentYear,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Transaction | null>(null);
  const [isDeletePending, setIsDeletePending] = useState(false);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<number[]>([]);
  const [isBulkDeletePending, setIsBulkDeletePending] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);

  const years = useMemo(() => {
    const base = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => base - i);
  }, []);

  const totalAmount = useMemo(
    () => transactions.reduce((sum, t) => sum + Number(t.amount), 0),
    [transactions]
  );

  const sourceCount = useMemo(
    () => new Set(transactions.map((t) => t.from_location_id)).size,
    [transactions]
  );

  const destinationCount = useMemo(
    () => new Set(transactions.map((t) => t.to_location_id)).size,
    [transactions]
  );
  const visibleTransactionIds = useMemo(
    () => transactions.map((transaction) => transaction.id),
    [transactions]
  );
  const allVisibleTransactionsSelected =
    visibleTransactionIds.length > 0 &&
    visibleTransactionIds.every((id) => selectedTransactionIds.includes(id));

  useEffect(() => {
    const visibleTransactionIdSet = new Set(visibleTransactionIds);
    setSelectedTransactionIds((current) =>
      current.filter((id) => visibleTransactionIdSet.has(id))
    );
  }, [transactions, visibleTransactionIds]);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/transactions?${params.toString()}`);
  }

  function resetFilters() {
    const params = new URLSearchParams();
    params.set("month", String(new Date().getMonth() + 1));
    params.set("year", String(new Date().getFullYear()));
    router.push(`/transactions?${params.toString()}`);
  }

  async function handleDelete() {
    if (!deleteTarget || isDeletePending) return;

    setIsDeletePending(true);
    try {
      const response = await deleteTransaction(deleteTarget.id);

      if (response?.error) {
        toast.error(response.error);
        return;
      }

      setDeleteTarget(null);
      toast.success("Virement supprime avec succes.");
      router.refresh();
    } finally {
      setIsDeletePending(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedTransactionIds.length === 0 || isBulkDeletePending) return;

    setIsBulkDeletePending(true);
    try {
      const response = await deleteTransactions(selectedTransactionIds);

      if (response?.error) {
        toast.error(response.error);
        return;
      }

      setIsBulkDeleteOpen(false);
      setSelectedTransactionIds([]);
      toast.success(
        `${response?.deletedCount ?? selectedTransactionIds.length} virement(s) supprime(s) avec succes.`
      );
      router.refresh();
    } finally {
      setIsBulkDeletePending(false);
    }
  }

  function toggleTransactionSelection(id: number, checked: boolean) {
    setSelectedTransactionIds((current) => {
      if (checked) {
        return current.includes(id) ? current : [...current, id];
      }
      return current.filter((selectedId) => selectedId !== id);
    });
  }

  function toggleAllVisibleTransactions(checked: boolean) {
    setSelectedTransactionIds(checked ? visibleTransactionIds : []);
  }

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,78,238,0.16),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(39,189,251,0.12),transparent_40%)]" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Virements Internes
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Suivi des transferts entre caisses avec controles mensuels.
            </p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="h-10 gap-2 rounded-xl bg-[var(--logo-primary)] text-white hover:brightness-110"
          >
            <PlusCircle className="h-4 w-4" />
            Ajouter Virement
          </Button>
        </div>

        <div className="relative z-10 mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <MiniStat label="Total Virements" value={String(transactions.length)} icon={<Send className="h-4 w-4" />} />
          <MiniStat label="Montant Total" value={formatAmountDh(totalAmount)} icon={<Wallet className="h-4 w-4" />} tone="text-[var(--logo-primary)]" />
          <MiniStat label="Caisses Source" value={String(sourceCount)} icon={<Building2 className="h-4 w-4" />} />
          <MiniStat label="Caisses Destination" value={String(destinationCount)} icon={<ArrowRight className="h-4 w-4" />} />
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white/85 p-3 backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-300">
            <CalendarDays className="h-3.5 w-3.5 text-[var(--logo-primary)]" />
            Filtres
          </div>

          <Select
            value={String(currentMonth)}
            onValueChange={(v) => updateFilter("month", v)}
          >
            <SelectTrigger className="h-9 w-[138px] rounded-xl border-slate-200/80 bg-white/90 dark:border-white/10 dark:bg-slate-800/70">
              <SelectValue placeholder="Mois" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((name, i) => (
                <SelectItem key={i + 1} value={String(i + 1)}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(currentYear)}
            onValueChange={(v) => updateFilter("year", v)}
          >
            <SelectTrigger className="h-9 w-[108px] rounded-xl border-slate-200/80 bg-white/90 dark:border-white/10 dark:bg-slate-800/70">
              <SelectValue placeholder="Annee" />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={String(year)}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={searchParams.get("from_location_id") ?? "all"}
            onValueChange={(v) =>
              updateFilter("from_location_id", v === "all" ? "" : v)
            }
          >
            <SelectTrigger className="h-9 w-[180px] rounded-xl border-slate-200/80 bg-white/90 dark:border-white/10 dark:bg-slate-800/70">
              <SelectValue placeholder="Caisse source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les sources</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={String(location.id)}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={searchParams.get("to_location_id") ?? "all"}
            onValueChange={(v) =>
              updateFilter("to_location_id", v === "all" ? "" : v)
            }
          >
            <SelectTrigger className="h-9 w-[205px] rounded-xl border-slate-200/80 bg-white/90 dark:border-white/10 dark:bg-slate-800/70">
              <SelectValue placeholder="Caisse destination" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les destinations</SelectItem>
              {locations.map((location) => (
                <SelectItem key={location.id} value={String(location.id)}>
                  {location.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 gap-1.5 rounded-xl"
            onClick={resetFilters}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </div>
      </section>

      {selectedTransactionIds.length > 0 ? (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm dark:border-rose-500/20 dark:bg-rose-500/10">
          <p className="font-medium text-rose-700 dark:text-rose-200">
            {selectedTransactionIds.length} virement(s) selectionne(s)
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => setSelectedTransactionIds([])}
            >
              Effacer la selection
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="rounded-xl"
              onClick={() => setIsBulkDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              Supprimer la selection
            </Button>
          </div>
        </section>
      ) : null}

      <section className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:block">
        <table className="w-full text-sm">
          <thead className="border-b border-slate-200/80 bg-slate-50/70 text-slate-600 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-300">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">
                <SelectionCheckbox
                  checked={allVisibleTransactionsSelected}
                  onCheckedChange={toggleAllVisibleTransactions}
                  ariaLabel="Selectionner tous les virements visibles"
                />
              </th>
              <th className="px-4 py-3 text-left font-semibold">Date</th>
              <th className="px-4 py-3 text-left font-semibold">Source</th>
              <th className="px-4 py-3 text-center font-semibold">Flux</th>
              <th className="px-4 py-3 text-left font-semibold">Destination</th>
              <th className="px-4 py-3 text-right font-semibold">Montant</th>
              <th className="px-4 py-3 text-right font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200/70 dark:divide-white/10">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                  Aucun virement trouve.
                </td>
              </tr>
            ) : (
              transactions.map((transaction) => (
                <tr key={transaction.id} className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                  <td className="px-4 py-3">
                    <SelectionCheckbox
                      checked={selectedTransactionIds.includes(transaction.id)}
                      onCheckedChange={(checked) =>
                        toggleTransactionSelection(transaction.id, checked)
                      }
                      ariaLabel={`Selectionner le virement ${transaction.id}`}
                    />
                  </td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatDate(transaction.date)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {transaction.from_location_name}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center rounded-full border border-slate-200/80 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:border-white/10 dark:bg-slate-800 dark:text-slate-300">
                      <ArrowRight className="mr-1 h-3.5 w-3.5" />
                      Virement
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                    {transaction.to_location_name}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-[var(--logo-primary)]">
                    {formatAmountDh(transaction.amount)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-rose-600 hover:text-rose-600"
                      onClick={() => setDeleteTarget(transaction)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {transactions.length > 0 ? (
            <tfoot className="border-t border-slate-200/80 bg-slate-50/70 dark:border-white/10 dark:bg-slate-800/60">
              <tr>
                <td colSpan={5} className="px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                  Total - {transactions.length} virement(s)
                </td>
                <td className="px-4 py-3 text-right text-sm font-bold text-[var(--logo-primary)]">
                  {formatAmountDh(totalAmount)}
                </td>
                <td />
              </tr>
            </tfoot>
          ) : null}
        </table>
      </section>

      <section className="space-y-3 lg:hidden">
        {transactions.length === 0 ? (
          <div className="rounded-xl border border-slate-200/80 bg-white/80 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-400">
            Aucun virement trouve.
          </div>
        ) : (
          transactions.map((transaction) => (
            <article
              key={transaction.id}
              className="rounded-xl border border-slate-200/80 bg-white/85 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-900/70"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <SelectionCheckbox
                    checked={selectedTransactionIds.includes(transaction.id)}
                    onCheckedChange={(checked) =>
                      toggleTransactionSelection(transaction.id, checked)
                    }
                    ariaLabel={`Selectionner le virement ${transaction.id}`}
                  />
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {formatDate(transaction.date)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-[var(--logo-primary)]">
                  {formatAmountDh(transaction.amount)}
                </p>
              </div>

              <div className="rounded-lg border border-slate-200/80 bg-white/75 p-2.5 dark:border-white/10 dark:bg-slate-800/60">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {transaction.from_location_name}
                </p>
                <p className="my-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-slate-700 dark:text-slate-200">
                  <ArrowRight className="h-3 w-3" />
                  vers
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {transaction.to_location_name}
                </p>
              </div>

              <div className="mt-3 flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full text-rose-600 hover:text-rose-600"
                  onClick={() => setDeleteTarget(transaction)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </article>
          ))
        )}
      </section>

      <TransactionFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        locations={locations}
      />

      <ConfirmActionDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletePending) {
            setDeleteTarget(null);
          }
        }}
        title="Supprimer ce virement ?"
        description={
          deleteTarget
            ? `Le virement de ${formatAmountDh(deleteTarget.amount)} entre ${deleteTarget.from_location_name} et ${deleteTarget.to_location_name} sera supprime definitivement.`
            : "Ce virement sera supprime definitivement."
        }
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        isPending={isDeletePending}
      />

      <ConfirmActionDialog
        open={isBulkDeleteOpen}
        onOpenChange={(open) => {
          if (!open && !isBulkDeletePending) {
            setIsBulkDeleteOpen(false);
          }
        }}
        title="Supprimer la selection ?"
        description={`Les ${selectedTransactionIds.length} virement(s) selectionne(s) seront supprimes definitivement.`}
        confirmLabel="Supprimer tout"
        onConfirm={handleBulkDelete}
        isPending={isBulkDeletePending}
      />
    </div>
  );
}

function MiniStat({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2.5 dark:border-white/10 dark:bg-slate-800/70">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          {label}
        </span>
        <span className={cn("text-slate-500 dark:text-slate-300", tone)}>{icon}</span>
      </div>
      <p className={cn("text-sm font-semibold text-slate-900 dark:text-slate-100", tone)}>{value}</p>
    </div>
  );
}

function formatAmountDh(value: number | string) {
  return `${Number(value).toLocaleString("fr-MA", {
    maximumFractionDigits: 0,
  })} DH`;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
