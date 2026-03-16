"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { PaginatedResult } from "@/features/recettes/types";
import type { SearchResult } from "@/features/search/queries";
import type { Location } from "@/features/admin/locations/queries";
import type { Category } from "@/features/admin/categories/queries";
import type { PaymentMethod } from "@/features/admin/payment-methods/queries";
import { Input } from "@/components/ui/input";

const formatAmount = (value: number) =>
  value.toLocaleString("fr-MA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

interface Props {
  result: PaginatedResult<SearchResult>;
  locations: Location[];
  categories: Category[];
  paymentMethods: PaymentMethod[];
  initialFilters: Record<string, string>;
}

const TYPE_OPTIONS = [
  { value: "", label: "Tous" },
  { value: "income", label: "Recettes" },
  { value: "expense", label: "Charges" },
];

const MATCH_MODE_OPTIONS = [
  { value: "broad", label: "Large" },
  { value: "exact", label: "Exact" },
];

const SORT_OPTIONS = [
  { value: "date_desc", label: "Date desc" },
  { value: "date_asc", label: "Date asc" },
  { value: "amount_desc", label: "Montant desc" },
  { value: "amount_asc", label: "Montant asc" },
];

const FILTER_LABELS: Record<string, string> = {
  type: "Type",
  match_mode: "Recherche",
  location_id: "Caisse",
  category: "Categorie",
  payment_method: "Paiement",
  date_from: "Depuis",
  date_to: "Jusqu a",
  amount_min: "Montant min",
  amount_max: "Montant max",
  price_min: "Montant min",
  price_max: "Montant max",
  sort: "Tri",
};

export function SearchClient({
  result,
  locations,
  categories,
  paymentMethods,
  initialFilters,
}: Props) {
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>(initialFilters);

  function applyFilters(updated: Record<string, string>, resetPage = true) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(updated)) {
      if (value) params.set(key, value);
    }

    if (resetPage) {
      params.delete("page");
    }

    const queryString = params.toString();
    router.push(`/search${queryString ? `?${queryString}` : ""}`);
  }

  function handleChange(key: string, value: string) {
    const updated = { ...filters, [key]: value };
    if (!value) {
      delete updated[key];
    }
    if (key === "match_mode" && value === "broad") {
      delete updated[key];
    }

    setFilters(updated);

    if (key === "q") {
      return;
    }

    applyFilters(updated);
  }

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    applyFilters(filters);
  }

  function removeFilter(key: string) {
    const updated = { ...filters };
    delete updated[key];
    setFilters(updated);
    applyFilters(updated);
  }

  function goToPage(page: number) {
    const updated = { ...filters, page: String(page) };
    setFilters(updated);
    applyFilters(updated, false);
  }

  function buildResultUrl(row: SearchResult) {
    const targetPath = row.type === "income" ? "/recettes" : "/charges";
    const params = new URLSearchParams();
    const targetPeriod = getTargetPeriod(filters, row.date);

    const globalQuery = (filters.q ?? "").trim();
    if (globalQuery) {
      params.set("search", globalQuery);
    }

    for (const key of ["location_id", "category", "payment_method"] as const) {
      const value = filters[key];
      if (value) {
        params.set(key, value);
      }
    }

    if (targetPeriod) {
      params.set("date_from", targetPeriod.dateFrom);
      params.set("date_to", targetPeriod.dateTo);
      params.set("filter_month", String(targetPeriod.month));
      params.set("filter_year", String(targetPeriod.year));
      params.set("filter_day", targetPeriod.day);
    }

    params.set("highlight_id", String(row.id));
    return `${targetPath}?${params.toString()}`;
  }

  function openResult(row: SearchResult) {
    router.push(buildResultUrl(row));
  }

  const activeFilterKeys = Object.keys(filters).filter(
    (key) => key !== "q" && key !== "page" && key !== "per_page" && filters[key]
  );

  const typeColor = (type: SearchResult["type"]) => {
    if (type === "income") return "bg-[#27bdfb1f] text-[#104eee]";
    return "bg-[#f59e0b1f] text-[#b45309]";
  };

  return (
    <div className="space-y-4 p-6">
      <form onSubmit={handleSearch} className="flex flex-wrap gap-2">
        <Input
          type="text"
          placeholder="Rechercher une transaction..."
          className="h-11 min-w-[260px] flex-1 rounded-lg border px-4 text-base focus:ring-2 focus:ring-[var(--logo-secondary)]"
          value={filters.q ?? ""}
          onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
        />
        <button
          type="submit"
          className="rounded-lg bg-[var(--logo-primary)] px-5 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Rechercher
        </button>
        <button
          type="button"
          onClick={() => setFiltersOpen((open) => !open)}
          className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
            filtersOpen ? "border-gray-400 bg-gray-100" : "hover:bg-gray-50"
          }`}
        >
          Filtres avances {filtersOpen ? "^" : "v"}
        </button>
      </form>

      {filtersOpen && (
        <div className="rounded-lg border bg-gray-50 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Mode de recherche</label>
              <select
                className="w-full rounded border px-2 py-1.5 text-sm"
                value={filters.match_mode ?? "broad"}
                onChange={(event) => handleChange("match_mode", event.target.value)}
              >
                {MATCH_MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Type</label>
              <select
                className="w-full rounded border px-2 py-1.5 text-sm"
                value={filters.type ?? ""}
                onChange={(event) => handleChange("type", event.target.value)}
              >
                {TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Caisse</label>
              <select
                className="w-full rounded border px-2 py-1.5 text-sm"
                value={filters.location_id ?? ""}
                onChange={(event) => handleChange("location_id", event.target.value)}
              >
                <option value="">Toutes</option>
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Categorie</label>
              <select
                className="w-full rounded border px-2 py-1.5 text-sm"
                value={filters.category ?? ""}
                onChange={(event) => handleChange("category", event.target.value)}
              >
                <option value="">Toutes</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Mode de paiement</label>
              <select
                className="w-full rounded border px-2 py-1.5 text-sm"
                value={filters.payment_method ?? ""}
                onChange={(event) => handleChange("payment_method", event.target.value)}
              >
                <option value="">Tous</option>
                {paymentMethods.map((payment) => (
                  <option key={payment.id} value={payment.name}>
                    {payment.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Date de</label>
              <input
                type="date"
                className="w-full rounded border px-2 py-1.5 text-sm"
                value={filters.date_from ?? ""}
                onChange={(event) => handleChange("date_from", event.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Date a</label>
              <input
                type="date"
                className="w-full rounded border px-2 py-1.5 text-sm"
                value={filters.date_to ?? ""}
                onChange={(event) => handleChange("date_to", event.target.value)}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Montant min (MAD)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-full rounded border px-2 py-1.5 text-sm"
                value={filters.amount_min ?? filters.price_min ?? ""}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  const updated = { ...filters };
                  if (nextValue) {
                    updated.amount_min = nextValue;
                  } else {
                    delete updated.amount_min;
                  }
                  delete updated.price_min;
                  setFilters(updated);
                  applyFilters(updated);
                }}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Montant max (MAD)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                className="w-full rounded border px-2 py-1.5 text-sm"
                value={filters.amount_max ?? filters.price_max ?? ""}
                onChange={(event) => {
                  const nextValue = event.target.value;
                  const updated = { ...filters };
                  if (nextValue) {
                    updated.amount_max = nextValue;
                  } else {
                    delete updated.amount_max;
                  }
                  delete updated.price_max;
                  setFilters(updated);
                  applyFilters(updated);
                }}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Trier par</label>
              <select
                className="w-full rounded border px-2 py-1.5 text-sm"
                value={filters.sort ?? "date_desc"}
                onChange={(event) => handleChange("sort", event.target.value)}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-600">
          <span className="font-semibold">{result.total}</span> resultat{result.total !== 1 ? "s" : ""} trouve
          {result.total !== 1 ? "s" : ""}
        </span>
        <span className="text-xs text-gray-500">Cliquez sur une ligne pour ouvrir la transaction dans son tableau.</span>
        {activeFilterKeys.map((key) => (
          <span
            key={key}
            className="flex items-center gap-1 rounded-full bg-[#27bdfb1f] px-3 py-0.5 text-xs text-[#104eee]"
          >
            <span>
              {FILTER_LABELS[key] ?? key}: {filters[key]}
            </span>
            <button
              onClick={() => removeFilter(key)}
              className="ml-1 font-bold hover:text-[#0b3aa8]"
              aria-label={`Supprimer filtre ${key}`}
            >
              x
            </button>
          </span>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Description</th>
              <th className="px-4 py-2 text-left">Categorie</th>
              <th className="px-4 py-2 text-left">Caisse</th>
              <th className="px-4 py-2 text-right">Montant (MAD)</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {result.data.map((row) => (
              <tr
                key={`${row.type}-${row.id}`}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => openResult(row)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    openResult(row);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <td className="px-4 py-2">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${typeColor(row.type)}`}>
                    {row.type_label}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-500">{row.date}</td>
                <td className="max-w-xs px-4 py-2 truncate" title={row.description}>
                  {row.description}
                </td>
                <td className="px-4 py-2 text-gray-500">{row.category}</td>
                <td className="px-4 py-2 text-gray-500">{row.location_name}</td>
                <td
                  className={`px-4 py-2 text-right font-medium tabular-nums ${
                    row.type === "income" ? "text-[var(--logo-secondary)]" : "text-[var(--logo-variation)]"
                  }`}
                >
                  {formatAmount(Number(row.amount))}
                </td>
              </tr>
            ))}
            {result.data.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  Aucun resultat trouve
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {result.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            Page {result.page} sur {result.total_pages}
          </span>
          <div className="flex gap-1">
            <button
              disabled={result.page <= 1}
              onClick={() => goToPage(result.page - 1)}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-40"
            >
              Precedent
            </button>
            {Array.from({ length: Math.min(result.total_pages, 7) }, (_, index) => {
              const page = index + 1;
              return (
                <button
                  key={page}
                  onClick={() => goToPage(page)}
                  className={`rounded border px-3 py-1 text-sm ${
                    page === result.page ? "border-[var(--logo-primary)] bg-[var(--logo-primary)] text-white" : "hover:bg-gray-50"
                  }`}
                >
                  {page}
                </button>
              );
            })}
            <button
              disabled={result.page >= result.total_pages}
              onClick={() => goToPage(result.page + 1)}
              className="rounded border px-3 py-1 text-sm hover:bg-gray-50 disabled:opacity-40"
            >
              Suivant
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

type DateParts = {
  raw: string;
  year: number;
  month: number;
  day: number;
};

type TargetPeriod = {
  dateFrom: string;
  dateTo: string;
  year: number;
  month: number;
  day: string;
};

function parseDateParts(value?: string) {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  if (month < 1 || month > 12) {
    return null;
  }

  const maxDay = getDaysInMonth(year, month);
  if (day < 1 || day > maxDay) {
    return null;
  }

  return {
    raw: value.trim(),
    year,
    month,
    day,
  } satisfies DateParts;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function getTargetPeriod(filters: Record<string, string>, fallbackDate: string): TargetPeriod | null {
  const fromParts = parseDateParts(filters.date_from);
  const toParts = parseDateParts(filters.date_to);

  if (fromParts && toParts) {
    const sameMonth = fromParts.year === toParts.year && fromParts.month === toParts.month;
    const sameDay = sameMonth && fromParts.day === toParts.day;
    const fullMonth =
      sameMonth &&
      fromParts.day === 1 &&
      toParts.day === getDaysInMonth(fromParts.year, fromParts.month);

    return {
      dateFrom: fromParts.raw,
      dateTo: toParts.raw,
      year: fromParts.year,
      month: fromParts.month,
      day: fullMonth ? "all" : sameDay ? String(fromParts.day) : "all",
    };
  }

  if (fromParts || toParts) {
    const singleDate = fromParts ?? toParts;
    if (!singleDate) return null;

    return {
      dateFrom: singleDate.raw,
      dateTo: singleDate.raw,
      year: singleDate.year,
      month: singleDate.month,
      day: String(singleDate.day),
    };
  }

  const fallbackParts = parseDateParts(fallbackDate);
  if (!fallbackParts) {
    return null;
  }

  return {
    dateFrom: fallbackParts.raw,
    dateTo: fallbackParts.raw,
    year: fallbackParts.year,
    month: fallbackParts.month,
    day: String(fallbackParts.day),
  };
}
