"use client";

import { useActionState, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Building2,
  Banknote,
  CalendarDays,
  CircleDollarSign,
  Coins,
  CreditCard,
  Download,
  Eye,
  FileText,
  HandCoins,
  ImageIcon,
  Landmark,
  MoreHorizontal,
  Pencil,
  PlusCircle,
  RotateCcw,
  ReceiptText,
  Search,
  SlidersHorizontal,
  Smartphone,
  Tag,
  Trash2,
  Wallet,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { createRecette, deleteRecette, deleteRecettes } from "@/features/recettes/actions";
import type { PaginatedResult, Recette, RecetteOverviewStats } from "@/features/recettes/types";
import type { Location } from "@/features/admin/locations/queries";
import type { Category } from "@/features/admin/categories/queries";
import type { PaymentMethod } from "@/features/admin/payment-methods/queries";
import { cn } from "@/lib/utils";
import { RecetteFormDialog } from "./RecetteFormDialog";
import { AttachmentUploadField } from "./AttachmentUploadField";
import { EmbedPdfPreview } from "@/components/pdf/EmbedPdfPreview";
import { ConfirmActionDialog } from "@/components/shared/ConfirmActionDialog";
import { SelectionCheckbox } from "@/components/shared/SelectionCheckbox";

interface Props {
  result: PaginatedResult<Recette>;
  locations: Location[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  years: number[];
  overviewStats: RecetteOverviewStats;
}

const MONTH_NAMES = [
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

export function RecettesClient({ result, locations, categories, paymentMethods, years, overviewStats }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const fromDate = parseDateSafe(searchParams.get("date_from"));
  const toDate = parseDateSafe(searchParams.get("date_to"));
  const selectedMonthRaw = Number(searchParams.get("filter_month") ?? (fromDate ? fromDate.getMonth() + 1 : currentMonth));
  const selectedYearRaw = Number(searchParams.get("filter_year") ?? (fromDate ? fromDate.getFullYear() : currentYear));
  const dayParam = searchParams.get("filter_day");
  const selectedMonth = Number.isFinite(selectedMonthRaw) && selectedMonthRaw >= 1 && selectedMonthRaw <= 12
    ? selectedMonthRaw
    : currentMonth;
  const availableYears = years.length > 0 ? years : [currentYear];
  const defaultYear = availableYears.includes(currentYear) ? currentYear : availableYears[0];
  const selectedYear = Number.isFinite(selectedYearRaw) && availableYears.includes(selectedYearRaw)
    ? selectedYearRaw
    : defaultYear;
  const daysInSelectedMonth = new Date(selectedYear, selectedMonth, 0).getDate();
  const isFullMonthRange =
    !!fromDate &&
    !!toDate &&
    fromDate.getFullYear() === selectedYear &&
    fromDate.getMonth() + 1 === selectedMonth &&
    fromDate.getDate() === 1 &&
    toDate.getFullYear() === selectedYear &&
    toDate.getMonth() + 1 === selectedMonth &&
    toDate.getDate() === daysInSelectedMonth;
  const isAllDays = dayParam === "all" || (!dayParam && isFullMonthRange);
  const selectedDayRaw = Number(dayParam && dayParam !== "all" ? dayParam : now.getDate());
  const selectedDay = Number.isFinite(selectedDayRaw) && selectedDayRaw >= 1 && selectedDayRaw <= daysInSelectedMonth
    ? selectedDayRaw
    : Math.min(now.getDate(), daysInSelectedMonth);
  const formDay = isAllDays ? Math.min(now.getDate(), daysInSelectedMonth) : selectedDay;
  const formDate = toDateInput(new Date(selectedYear, selectedMonth - 1, formDay));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRecette, setEditingRecette] = useState<Recette | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRecette, setPreviewRecette] = useState<Recette | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Recette | null>(null);
  const [isDeletePending, setIsDeletePending] = useState(false);
  const [selectedRecetteIds, setSelectedRecetteIds] = useState<number[]>([]);
  const [isBulkDeletePending, setIsBulkDeletePending] = useState(false);
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = useState(false);
  const [flashRecetteId, setFlashRecetteId] = useState<number | null>(null);
  const [highlightRecetteId, setHighlightRecetteId] = useState<number | null>(null);
  const highlightIdParam = searchParams.get("highlight_id");
  const periodLabel = getPeriodLabel(searchParams.get("date_from"), searchParams.get("date_to"));
  const paymentVisualMap = buildPaymentVisualMap(result.data.map((row) => row.payment_method));
  const visibleRecetteIds = useMemo(() => result.data.map((row) => row.id), [result.data]);
  const allVisibleRecettesSelected =
    visibleRecetteIds.length > 0 &&
    visibleRecetteIds.every((id) => selectedRecetteIds.includes(id));

  useEffect(() => {
    const visibleRecetteIdSet = new Set(visibleRecetteIds);
    setSelectedRecetteIds((current) => current.filter((id) => visibleRecetteIdSet.has(id)));
  }, [result.data, visibleRecetteIds]);

  useEffect(() => {
    if (flashRecetteId == null) return;
    const timer = window.setTimeout(() => setFlashRecetteId(null), 3000);
    return () => window.clearTimeout(timer);
  }, [flashRecetteId]);

  useEffect(() => {
    const parsedId = Number(highlightIdParam);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return;
    }

    if (!result.data.some((entry) => entry.id === parsedId)) {
      return;
    }

    const activateTimer = window.setTimeout(() => {
      setHighlightRecetteId(parsedId);
    }, 0);

    const scrollTimer = window.setTimeout(() => {
      const candidates = Array.from(
        document.querySelectorAll<HTMLElement>(`[data-search-highlight-id="${parsedId}"]`)
      );
      const target = candidates.find((node) => node.offsetParent !== null) ?? candidates[0];
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);

    const clearTimer = window.setTimeout(() => {
      setHighlightRecetteId(null);
    }, 4000);

    return () => {
      window.clearTimeout(activateTimer);
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);
    };
  }, [highlightIdParam, result.data]);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== "page") params.delete("page");
    router.push(`/recettes?${params.toString()}`);
  }

  function updateFilters(updates: Record<string, string | null | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    }
    params.delete("page");
    router.push(`/recettes?${params.toString()}`);
  }

  function resetFilters() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("location_id");
    params.delete("category");
    params.delete("page");
    router.push(`/recettes${params.toString() ? `?${params.toString()}` : ""}`);
  }

  function applyMonthYear(nextMonth: number, nextYear: number) {
    applyDateParts(isAllDays ? null : selectedDay, nextMonth, nextYear);
  }

  function applyDateParts(nextDay: number | null, nextMonth: number, nextYear: number) {
    const safeMonth = Math.min(12, Math.max(1, nextMonth));
    const safeYear = availableYears.includes(nextYear) ? nextYear : defaultYear;
    const monthDays = new Date(safeYear, safeMonth, 0).getDate();
    const normalizedDay =
      nextDay == null ? null : Math.max(1, Math.min(monthDays, nextDay));
    const from = normalizedDay
      ? new Date(safeYear, safeMonth - 1, normalizedDay)
      : new Date(safeYear, safeMonth - 1, 1);
    const to = normalizedDay
      ? new Date(safeYear, safeMonth - 1, normalizedDay)
      : new Date(safeYear, safeMonth, 0);
    updateFilters({
      filter_month: String(safeMonth),
      filter_year: String(safeYear),
      filter_day: normalizedDay ? String(normalizedDay) : "all",
      date_from: toDateInput(from),
      date_to: toDateInput(to),
    });
  }

  function clearPeriodFilter() {
    const resetMonth = now.getMonth() + 1;
    const resetYear = now.getFullYear();
    updateFilters({
      filter_day: "all",
      filter_month: String(resetMonth),
      filter_year: String(resetYear),
      date_from: toDateInput(new Date(resetYear, resetMonth - 1, 1)),
      date_to: toDateInput(new Date(resetYear, resetMonth, 0)),
    });
  }

  async function handleDelete() {
    if (!deleteTarget || isDeletePending) return;

    setIsDeletePending(true);
    try {
      const response = await deleteRecette(deleteTarget.id);

      if (response?.error) {
        toast.error(response.error);
        return;
      }

      setDeleteTarget(null);
      toast.success("Recette supprimee avec succes.");
      router.refresh();
    } finally {
      setIsDeletePending(false);
    }
  }

  async function handleBulkDelete() {
    if (selectedRecetteIds.length === 0 || isBulkDeletePending) return;

    setIsBulkDeletePending(true);
    try {
      const response = await deleteRecettes(selectedRecetteIds);

      if (response?.error) {
        toast.error(response.error);
        return;
      }

      setIsBulkDeleteOpen(false);
      setSelectedRecetteIds([]);
      toast.success(`${response?.deletedCount ?? selectedRecetteIds.length} recette(s) supprimee(s) avec succes.`);
      router.refresh();
    } finally {
      setIsBulkDeletePending(false);
    }
  }

  function toggleRecetteSelection(id: number, checked: boolean) {
    setSelectedRecetteIds((current) => {
      if (checked) {
        return current.includes(id) ? current : [...current, id];
      }
      return current.filter((selectedId) => selectedId !== id);
    });
  }

  function toggleAllVisibleRecettes(checked: boolean) {
    setSelectedRecetteIds(checked ? visibleRecetteIds : []);
  }

  function handleEdit(recette: Recette) {
    setEditingRecette(recette);
    setDialogOpen(true);
  }

  function handlePreview(recette: Recette) {
    if (!recette.attachment_path) return;
    setPreviewRecette(recette);
    setPreviewOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-900/70 md:p-4">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,78,238,0.16),transparent_43%),radial-gradient(circle_at_bottom_right,rgba(39,189,251,0.14),transparent_45%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(39,189,251,0.20),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(16,78,238,0.16),transparent_45%)]" />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Recettes</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Pilotage des encaissements avec un suivi rapide par caisse, categorie et mode de paiement.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-300">
              {periodLabel}
            </span>
            <span className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-300">
              {result.total} enregistrement{result.total > 1 ? "s" : ""}
            </span>
          </div>
        </div>

        <div className="relative z-10 mt-3 flex flex-wrap items-start gap-2.5">
          <div className="grid min-w-[260px] flex-1 grid-cols-2 gap-2.5 md:grid-cols-4">
          <MiniStat
            label="Total Recettes"
            value={formatAmountDh(overviewStats.all_time_total)}
            icon={<Banknote className="h-4 w-4" />}
            tone="text-[var(--logo-secondary)]"
          />
          <MiniStat
            label="Total Mois Actuel"
            value={formatAmountDh(overviewStats.current_month_total)}
            icon={<Wallet className="h-4 w-4" />}
            tone="text-[var(--logo-primary)]"
          />
          <MiniStat
            label="Records Ce Mois"
            value={String(overviewStats.current_month_count)}
            icon={<CreditCard className="h-4 w-4" />}
            tone="text-sky-600 dark:text-sky-300"
          />
          <div className="rounded-xl border border-slate-200/80 bg-white/80 px-2.5 py-2 dark:border-white/10 dark:bg-slate-800/70">
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                Total Mois Par Caisse
              </span>
              <Landmark className="h-4 w-4 text-violet-600 dark:text-violet-300" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {overviewStats.current_month_by_location.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">Aucune donnee</p>
              ) : (
                overviewStats.current_month_by_location.map((location) => (
                  <div
                    key={location.location_id}
                    className="inline-flex items-center gap-1.5 rounded-md border border-slate-200/80 bg-white/80 px-2 py-1 text-[11px] dark:border-white/10 dark:bg-slate-900/40"
                  >
                    <span className="whitespace-nowrap font-semibold text-slate-700 dark:text-slate-200">
                      {location.location_code || formatCaisseCode(location.location_id)}
                    </span>
                    <span className="shrink-0 whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                      {formatAmountDh(location.total)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
          </div>
          <div className="min-w-[240px] rounded-xl border border-slate-200/80 bg-white/80 p-2.5 dark:border-white/10 dark:bg-slate-800/70">
            <div className="flex flex-wrap items-end gap-2">
              <select
                value={isAllDays ? "all" : String(selectedDay)}
                onChange={(e) =>
                  applyDateParts(e.target.value === "all" ? null : Number(e.target.value), selectedMonth, selectedYear)
                }
                className="h-9 w-[78px] rounded-lg border border-slate-200/80 bg-white/90 px-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[var(--logo-secondary)] dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-100"
              >
                <option value="all">Tous</option>
                {Array.from({ length: daysInSelectedMonth }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={String(day)}>
                    {day}
                  </option>
                ))}
              </select>

              <select
                value={String(selectedMonth)}
                onChange={(e) => applyMonthYear(Number(e.target.value), selectedYear)}
                className="h-9 w-[126px] rounded-lg border border-slate-200/80 bg-white/90 px-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[var(--logo-secondary)] dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-100"
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={i + 1} value={String(i + 1)}>
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={String(selectedYear)}
                onChange={(e) => applyMonthYear(selectedMonth, Number(e.target.value))}
                className="h-9 w-[96px] rounded-lg border border-slate-200/80 bg-white/90 px-2 text-sm text-slate-800 outline-none focus:ring-2 focus:ring-[var(--logo-secondary)] dark:border-white/10 dark:bg-slate-900/40 dark:text-slate-100"
              >
                {availableYears.map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </select>

              <Button type="button" variant="outline" size="sm" className="h-9 px-2.5 text-[11px]" onClick={clearPeriodFilter}>
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                Reset
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <RecetteCreatePanel
          locations={locations}
          categories={categories}
          paymentMethods={paymentMethods}
          formDate={formDate}
        />

        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-900/70">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,78,238,0.10),transparent_48%),radial-gradient(circle_at_bottom_right,rgba(39,189,251,0.10),transparent_44%)]" />
            <div className="relative z-10 space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-200">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--logo-primary)]" />
                  Filtres avances
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-slate-200/80 bg-white/80 px-2.5 py-1 text-[11px] font-medium text-slate-600 dark:border-white/10 dark:bg-slate-800/70 dark:text-slate-300">
                    {result.total} lignes
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetFilters}
                    className="h-8 gap-1.5 text-xs"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-12">
                <div className="relative lg:col-span-8">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    key={searchParams.get("search") ?? ""}
                    placeholder="Rechercher par description..."
                    defaultValue={searchParams.get("search") ?? ""}
                    onChange={(e) => updateFilter("search", e.target.value)}
                    className="h-10 rounded-xl border-slate-200/80 bg-white/90 pl-9 dark:border-white/10 dark:bg-slate-800/70"
                  />
                </div>

                <div className="relative lg:col-span-2">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Select
                    value={searchParams.get("location_id") ?? "all"}
                    onValueChange={(v) => updateFilter("location_id", v === "all" ? "" : v)}
                  >
                    <SelectTrigger className="h-10 rounded-xl border-slate-200/80 bg-white/90 pl-9 dark:border-white/10 dark:bg-slate-800/70">
                      <SelectValue placeholder="Caisse" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les caisses</SelectItem>
                      {locations.map((l) => (
                        <SelectItem key={l.id} value={String(l.id)}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="relative lg:col-span-2">
                  <Tag className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Select
                    value={searchParams.get("category") ?? "all"}
                    onValueChange={(v) => updateFilter("category", v === "all" ? "" : v)}
                  >
                    <SelectTrigger className="h-10 w-full rounded-xl border-slate-200/80 bg-white/90 pl-9 dark:border-white/10 dark:bg-slate-800/70">
                      <SelectValue placeholder="Choisir une categorie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les categories</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.name}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {selectedRecetteIds.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200/70 bg-rose-50/80 px-4 py-3 text-sm dark:border-rose-500/20 dark:bg-rose-500/10">
              <p className="font-medium text-rose-700 dark:text-rose-200">
                {selectedRecetteIds.length} recette(s) selectionnee(s)
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => setSelectedRecetteIds([])}
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
            </div>
          ) : null}

          <div className="hidden overflow-hidden rounded-2xl border border-slate-200/80 bg-white/85 backdrop-blur dark:border-white/10 dark:bg-slate-900/70 lg:block">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200/80 bg-slate-50/70 text-slate-600 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">
                    <SelectionCheckbox
                      checked={allVisibleRecettesSelected}
                      onCheckedChange={toggleAllVisibleRecettes}
                      ariaLabel="Selectionner toutes les recettes visibles"
                    />
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">Date</th>
                  <th className="px-4 py-3 text-right font-semibold">Montant</th>
                  <th className="px-4 py-3 text-left font-semibold">Description</th>
                  <th className="px-4 py-3 text-left font-semibold">Categorie</th>
                  <th className="px-4 py-3 text-left font-semibold">Caisse</th>
                  <th className="px-4 py-3 text-center font-semibold">Paiement</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/70 dark:divide-white/10">
                {result.data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-slate-500 dark:text-slate-400">
                      Aucune recette trouvee
                    </td>
                  </tr>
                ) : (
                  result.data.map((recette) => {
                    const payment = paymentVisualMap.get(normalizePaymentMethod(recette.payment_method)) ?? FALLBACK_PAYMENT_VISUAL;
                    return (
                      <tr
                        key={recette.id}
                        data-search-highlight-id={recette.id}
                        className={cn(
                          "transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40",
                          flashRecetteId === recette.id && "new-row-flash",
                          highlightRecetteId === recette.id && "search-row-highlight"
                        )}
                      >
                        <td className="px-4 py-3">
                          <SelectionCheckbox
                            checked={selectedRecetteIds.includes(recette.id)}
                            onCheckedChange={(checked) => toggleRecetteSelection(recette.id, checked)}
                            ariaLabel={`Selectionner la recette ${toSentenceCase(recette.description)}`}
                          />
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                          {formatDateClear(recette.date)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-[var(--logo-secondary)]">
                          {formatAmountDh(recette.amount)}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">
                          {toSentenceCase(recette.description)}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {recette.category}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-slate-700 dark:text-slate-200">{formatCaisseCode(recette.location_id)}</td>
                        <td className="px-4 py-3 text-center">
                          <span
                            title={recette.payment_method}
                            className={cn("inline-flex h-8 w-8 items-center justify-center rounded-full border", payment.tone)}
                          >
                            <payment.icon className="h-4 w-4" />
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <ActionsMenu
                            recette={recette}
                            onEdit={() => handleEdit(recette)}
                            onDelete={() => setDeleteTarget(recette)}
                            onPreview={() => handlePreview(recette)}
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 lg:hidden">
            {result.data.length === 0 ? (
              <div className="rounded-xl border border-slate-200/80 bg-white/80 p-6 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-400">
                Aucune recette trouvee
              </div>
            ) : (
              result.data.map((recette) => {
                const payment = paymentVisualMap.get(normalizePaymentMethod(recette.payment_method)) ?? FALLBACK_PAYMENT_VISUAL;
                return (
                  <article
                    key={recette.id}
                    data-search-highlight-id={recette.id}
                    className={cn(
                      "rounded-xl border border-slate-200/80 bg-white/85 p-4 backdrop-blur dark:border-white/10 dark:bg-slate-900/70",
                      flashRecetteId === recette.id && "new-row-flash",
                      highlightRecetteId === recette.id && "search-row-highlight"
                    )}
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <SelectionCheckbox
                          checked={selectedRecetteIds.includes(recette.id)}
                          onCheckedChange={(checked) => toggleRecetteSelection(recette.id, checked)}
                          ariaLabel={`Selectionner la recette ${toSentenceCase(recette.description)}`}
                        />
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {formatDateClear(recette.date)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-[var(--logo-secondary)]">
                        {formatAmountDh(recette.amount)}
                      </p>
                    </div>

                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {toSentenceCase(recette.description)}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {recette.category}
                        </Badge>
                        <span className="rounded-full border border-slate-200/80 bg-white/75 px-2.5 py-1 text-xs font-medium text-slate-600 dark:border-white/10 dark:bg-slate-800/65 dark:text-slate-300">
                          {formatCaisseCode(recette.location_id)}
                        </span>
                        <span
                          title={recette.payment_method}
                          className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full border", payment.tone)}
                        >
                          <payment.icon className="h-3.5 w-3.5" />
                        </span>
                      </div>
                      <ActionsMenu
                        recette={recette}
                        onEdit={() => handleEdit(recette)}
                        onDelete={() => setDeleteTarget(recette)}
                        onPreview={() => handlePreview(recette)}
                      />
                    </div>
                  </article>
                );
              })
            )}
          </div>

        </div>
      </div>

      <RecetteFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        recette={editingRecette}
        locations={locations}
        categories={categories}
        paymentMethods={paymentMethods}
        onSaved={setFlashRecetteId}
      />

      <AttachmentPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        recette={previewRecette}
      />

      <ConfirmActionDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !isDeletePending) {
            setDeleteTarget(null);
          }
        }}
        title="Supprimer cette recette ?"
        description={
          deleteTarget
            ? `La recette "${toSentenceCase(deleteTarget.description)}" pour ${formatAmountDh(deleteTarget.amount)} sera supprimee definitivement.`
            : "Cette recette sera supprimee definitivement."
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
        description={`Les ${selectedRecetteIds.length} recette(s) selectionnee(s) seront supprimees definitivement.`}
        confirmLabel="Supprimer tout"
        onConfirm={handleBulkDelete}
        isPending={isBulkDeletePending}
      />
    </div>
  );
}

function RecetteCreatePanel({
  locations,
  categories,
  paymentMethods,
  formDate,
}: {
  locations: Location[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  formDate: string;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, isPending] = useActionState(createRecette, null);
  const [isSubmitLocked, setIsSubmitLocked] = useState(false);
  const handledToastRef = useRef<string | null>(null);
  const paymentVisualMap = buildPaymentVisualMap(paymentMethods.map((pm) => pm.name));
  const submitAction = useCallback(
    async (formData: FormData) => {
      if (isSubmitLocked) return;
      handledToastRef.current = null;
      setIsSubmitLocked(true);
      try {
        await formAction(formData);
      } finally {
        setIsSubmitLocked(false);
      }
    },
    [formAction, isSubmitLocked]
  );

  useEffect(() => {
    const toastKey = state
      ? state.success
        ? "success"
        : state.error
          ? `error:${state.error}`
          : null
      : null;

    if (toastKey && handledToastRef.current === toastKey) {
      return;
    }

    if (state?.success) {
      handledToastRef.current = "success";
      toast.success("Recette ajoutee avec succes.");
      formRef.current?.reset();
      router.refresh();
    } else if (state?.error) {
      handledToastRef.current = `error:${state.error}`;
      toast.error(state.error);
    }
  }, [state, router]);

  return (
    <div className="xl:sticky xl:top-24">
      <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-5 backdrop-blur dark:border-white/10 dark:bg-slate-900/75">
        <form
          ref={formRef}
          action={submitAction}
          className="space-y-3.5"
        >
          <input type="hidden" name="date" value={formDate} />

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <div className="relative">
              <ReceiptText className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <Textarea
                id="description"
                name="description"
                placeholder="Ex: Paiement formation bureautique"
                className="pl-9"
                required
              />
            </div>
            {state?.fieldErrors?.description ? (
              <p className="text-xs text-destructive">{state.fieldErrors.description[0]}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount">Montant (DH)</Label>
            <div className="relative">
              <CircleDollarSign className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 4000"
                className="pl-9"
                required
              />
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1 text-[11px] font-medium text-slate-600 dark:border-white/10 dark:bg-slate-800/60 dark:text-slate-300">
              <CalendarDays className="h-3.5 w-3.5 text-[var(--logo-primary)]" />
              Date appliquee depuis le header: {formatDateClear(formDate)}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Categorie</Label>
            <div>
              <Select name="category" required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choisir une categorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Paiement</Label>
            <div className="grid grid-cols-3 gap-2">
              {paymentMethods.map((pm) => {
                const visual =
                  paymentVisualMap.get(normalizePaymentMethod(pm.name)) ?? FALLBACK_PAYMENT_VISUAL;
                return (
                  <label
                    key={pm.id}
                    className="group cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={pm.name}
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
            {state?.fieldErrors?.payment_method ? (
              <p className="text-xs text-destructive">{state.fieldErrors.payment_method[0]}</p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <Label>Caisse</Label>
            <div className="grid grid-cols-4 gap-2">
              {locations.map((location) => (
                <label key={location.id} className="group cursor-pointer">
                  <input
                    type="radio"
                    name="location_id"
                    value={String(location.id)}
                    required
                    className="peer sr-only"
                  />
                  <span
                    className={cn(
                      "flex h-10 items-center justify-center rounded-xl border px-2.5 text-center transition",
                      "border-slate-200/80 bg-white/75 hover:border-slate-300 dark:border-white/10 dark:bg-slate-800/60 dark:hover:border-white/20",
                      "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--logo-primary)]/40",
                      "peer-checked:border-[var(--logo-primary)]/40 peer-checked:bg-[var(--logo-primary)]/10"
                    )}
                  >
                    <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                      {formatCaisseCode(location.id)}
                    </span>
                  </span>
                </label>
              ))}
            </div>
            {state?.fieldErrors?.location_id ? (
              <p className="text-xs text-destructive">{state.fieldErrors.location_id[0]}</p>
            ) : null}
          </div>

          <AttachmentUploadField />

          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <Button
            type="submit"
            disabled={isPending || isSubmitLocked}
            className={cn(
              "group relative w-full overflow-hidden border-0 text-white",
              "bg-gradient-to-r from-[var(--logo-primary)] to-[var(--logo-secondary)]",
              "shadow-[0_10px_24px_-12px_rgba(16,78,238,0.85)] transition-all duration-300",
              "hover:scale-[1.01] hover:brightness-110 active:scale-[0.99]",
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
              ) : (
                <>
                  <PlusCircle className="h-4 w-4" />
                  Ajouter la recette
                </>
              )}
            </span>
          </Button>
        </form>
      </div>
    </div>
  );
}

function ActionsMenu({
  recette,
  onEdit,
  onDelete,
  onPreview,
}: {
  recette: Recette;
  onEdit: () => void;
  onDelete: () => void;
  onPreview: () => void;
}) {
  const hasAttachment = Boolean(recette.attachment_path);
  const downloadUrl = recette.attachment_id
    ? `/api/uploads/recettes/${recette.attachment_id}/preview?download=1`
    : (recette.attachment_path ?? "#");
  const fileName = getAttachmentStoredName(recette.attachment_path, recette.attachment_name);
  const downloadName = ensureFileExtension(fileName, recette.attachment_mime_type ?? "");
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {hasAttachment ? (
          <DropdownMenuItem onClick={onPreview} className="gap-2">
            <Eye className="h-4 w-4" />
            Voir le fichier
          </DropdownMenuItem>
        ) : null}
        {hasAttachment ? (
          <DropdownMenuItem asChild className="gap-2">
            <a href={downloadUrl} download={downloadName}>
              <Download className="h-4 w-4" />
              Telecharger
            </a>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem onClick={onEdit} className="gap-2">
          <Pencil className="h-4 w-4" />
          Modifier
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onDelete} className="gap-2 text-rose-600 focus:text-rose-600">
          <Trash2 className="h-4 w-4" />
          Supprimer
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AttachmentPreviewDialog({
  open,
  onOpenChange,
  recette,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recette: Recette | null;
}) {
  const filePath = recette?.attachment_path ?? null;
  const previewPath = recette?.attachment_id ? `/api/uploads/recettes/${recette.attachment_id}/preview` : filePath;
  const downloadUrl = recette?.attachment_id
    ? `/api/uploads/recettes/${recette.attachment_id}/preview?download=1`
    : filePath;
  const mimeType = recette?.attachment_mime_type ?? "";
  const fileName = getAttachmentStoredName(filePath, recette?.attachment_name);
  const downloadName = ensureFileExtension(fileName, mimeType);
  const isPdf =
    mimeType === "application/pdf" ||
    /\.pdf$/i.test(fileName) ||
    filePath?.toLowerCase().endsWith(".pdf");
  const isImage = Boolean(mimeType.startsWith("image/") || /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(filePath ?? ""));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isPdf ? <FileText className="h-4 w-4" /> : isImage ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
            <span className="truncate">{fileName}</span>
          </DialogTitle>
        </DialogHeader>

        {!filePath ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Aucun fichier ÃƒÂ  afficher.</p>
        ) : isPdf ? (
          <EmbedPdfPreview src={previewPath ?? ""} />
        ) : isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewPath ?? ""}
            alt={fileName}
            className="max-h-[70vh] w-full rounded-lg border border-slate-200/80 object-contain dark:border-white/10"
          />
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              PrÃƒÂ©visualisation non disponible pour ce type de fichier.
            </p>
            <a
              href={downloadUrl ?? "#"}
              download={downloadName}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 dark:border-white/10 dark:text-slate-200"
            >
              <Download className="h-4 w-4" />
              Telecharger le fichier
            </a>
          </div>
        )}
      </DialogContent>
    </Dialog>
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
  icon: ReactNode;
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
      <p className={cn("text-sm font-semibold text-slate-900 dark:text-slate-100", tone)}>
        {value}
      </p>
    </div>
  );
}

function formatAmountDh(value: number | string) {
  return `${Number(value).toLocaleString("fr-MA", { maximumFractionDigits: 0 })} DH`;
}

function parseDateSafe(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getPeriodLabel(from: string | null, to: string | null) {
  if (!from && !to) return "Periode: tout";
  if (from && to) return `${formatDateClear(from)} -> ${formatDateClear(to)}`;
  if (from) return `Depuis ${formatDateClear(from)}`;
  return `Jusqu'a ${formatDateClear(to ?? "")}`;
}

function formatDateClear(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatCaisseCode(locationId: number) {
  return `C${locationId}`;
}

function getAttachmentStoredName(filePath?: string | null, fallbackName?: string | null) {
  if (filePath) {
    const pathParts = filePath.split("/");
    const rawName = pathParts[pathParts.length - 1]?.split("?")[0];
    if (rawName) return decodeURIComponent(rawName);
  }
  if (fallbackName?.trim()) return fallbackName;
  return "fichier";
}

function extensionFromMime(mimeType: string) {
  const normalized = (mimeType || "").toLowerCase();
  if (normalized === "application/pdf") return ".pdf";
  if (normalized === "image/png") return ".png";
  if (normalized === "image/webp") return ".webp";
  if (normalized === "image/gif") return ".gif";
  if (normalized === "image/jpeg" || normalized === "image/jpg") return ".jpg";
  return "";
}

function ensureFileExtension(fileName: string, mimeType: string) {
  if (/\.[a-z0-9]{2,8}$/i.test(fileName)) return fileName;
  const ext = extensionFromMime(mimeType);
  return ext ? `${fileName}${ext}` : fileName;
}

function toSentenceCase(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return "";
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

type PaymentVisual = {
  icon: typeof Wallet;
  tone: string;
};

const PAYMENT_VISUAL_POOL: PaymentVisual[] = [
  { icon: Banknote, tone: "border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300" },
  { icon: Landmark, tone: "border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-300" },
  { icon: CreditCard, tone: "border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-300" },
  { icon: Smartphone, tone: "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300" },
  { icon: ReceiptText, tone: "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300" },
  { icon: Coins, tone: "border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-300" },
  { icon: HandCoins, tone: "border-cyan-200 bg-cyan-50 text-cyan-600 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-300" },
  { icon: Building2, tone: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-600 dark:border-fuchsia-500/30 dark:bg-fuchsia-500/10 dark:text-fuchsia-300" },
  { icon: CircleDollarSign, tone: "border-teal-200 bg-teal-50 text-teal-600 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-300" },
];

const FALLBACK_PAYMENT_VISUAL: PaymentVisual = {
  icon: Wallet,
  tone: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-500/30 dark:bg-slate-500/10 dark:text-slate-300",
};

function normalizePaymentMethod(method: string) {
  return method.trim().toLowerCase();
}

function getPreferredPaymentVisual(method: string): PaymentVisual | null {
  const normalized = normalizePaymentMethod(method);
  if (
    normalized.includes("espece") ||
    normalized.includes("esp ") ||
    normalized.includes("cash") ||
    normalized.includes("liquide")
  ) {
    return PAYMENT_VISUAL_POOL[0];
  }
  if (
    normalized.includes("virement") ||
    normalized.includes("transfer") ||
    normalized.includes("bank") ||
    normalized.includes("wire")
  ) {
    return PAYMENT_VISUAL_POOL[1];
  }
  if (
    normalized.includes("carte") ||
    normalized.includes("card") ||
    normalized.includes("visa") ||
    normalized.includes("mastercard") ||
    normalized.includes("credit") ||
    normalized.includes("debit")
  ) {
    return PAYMENT_VISUAL_POOL[2];
  }
  if (
    normalized.includes("ligne") ||
    normalized.includes("online") ||
    normalized.includes("mobile") ||
    normalized.includes("wallet") ||
    normalized.includes("paypal")
  ) {
    return PAYMENT_VISUAL_POOL[3];
  }
  if (normalized.includes("cheque") || normalized.includes("check")) return PAYMENT_VISUAL_POOL[4];
  return null;
}

function formatPaymentLabel(method: string) {
  const normalized = normalizePaymentMethod(method);
  if (normalized === "bank_transfer") return "bank";
  return method;
}

function buildPaymentVisualMap(methods: string[]) {
  const uniqueMethods = Array.from(
    new Set(methods.map((method) => normalizePaymentMethod(method)).filter(Boolean))
  );
  const visualMap = new Map<string, PaymentVisual>();
  for (const method of uniqueMethods) {
    visualMap.set(method, getPreferredPaymentVisual(method) ?? getDeterministicPaymentVisual(method));
  }

  return visualMap;
}

function getDeterministicPaymentVisual(method: string): PaymentVisual {
  const normalized = normalizePaymentMethod(method);
  if (!normalized) return FALLBACK_PAYMENT_VISUAL;

  let hash = 0;
  for (let index = 0; index < normalized.length; index += 1) {
    hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
  }

  return PAYMENT_VISUAL_POOL[hash % PAYMENT_VISUAL_POOL.length] ?? FALLBACK_PAYMENT_VISUAL;
}


