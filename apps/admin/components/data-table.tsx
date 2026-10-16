"use client";

// A TanStack Table whose search, filters, sorting and page live in the URL, so lists
// are server-rendered, shareable and survive reloads. The API does the sorting and paging.
import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/form-controls";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export interface FilterDef {
  param: string;
  label: string;
  options: { value: string; label: string }[];
  /** Value meaning "no filter" (sent as nothing). */
  defaultValue?: string;
}

/** Column meta: the API sort key, if the column can be sorted. */
export type SortMeta = { sortKey?: string };

function useUrlParams() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const set = (updates: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    if (resetPage) next.delete("page");
    startTransition(() => router.replace(`${pathname}${next.size ? `?${next}` : ""}`, { scroll: false }));
  };
  return { params, set, pending };
}

export function DataTable<T>({
  columns,
  data,
  total,
  page,
  pageSize,
  defaultSort,
  defaultOrder = "asc",
  filters = [],
  searchPlaceholder = "Search",
  emptyMessage = "Nothing found.",
}: {
  columns: ColumnDef<T, unknown>[];
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  defaultSort: string;
  defaultOrder?: "asc" | "desc";
  filters?: FilterDef[];
  searchPlaceholder?: string;
  emptyMessage?: string;
}) {
  const { params, set, pending } = useUrlParams();
  const sort = params.get("sort") ?? defaultSort;
  const order = (params.get("order") ?? defaultOrder) as "asc" | "desc";
  const [search, setSearch] = useState(params.get("search") ?? "");

  // Debounced search: update the URL 300 ms after typing stops.
  useEffect(() => {
    if (search === (params.get("search") ?? "")) return;
    const t = setTimeout(() => set({ search: search.trim() || null }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel(), manualSorting: true, manualPagination: true });
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={searchPlaceholder} aria-label={searchPlaceholder} className="pl-9" />
        </div>
        {filters.map((f) => (
          <Select
            key={f.param}
            aria-label={f.label}
            className="sm:w-48"
            value={params.get(f.param) ?? f.defaultValue ?? ""}
            onChange={(e) => set({ [f.param]: e.target.value === (f.defaultValue ?? "") ? null : e.target.value })}
          >
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        ))}
      </div>

      <div className={cn("transition-opacity", pending && "opacity-60")}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((h) => {
                  const sortKey = (h.column.columnDef.meta as SortMeta | undefined)?.sortKey;
                  const active = sortKey && sort === sortKey;
                  return (
                    <TableHead key={h.id} aria-sort={active ? (order === "asc" ? "ascending" : "descending") : undefined}>
                      {sortKey ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 uppercase hover:text-foreground"
                          onClick={() => set({ sort: sortKey, order: active && order === "asc" ? "desc" : "asc" })}
                        >
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {active ? order === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ChevronsUpDown className="size-3 opacity-50" />}
                        </button>
                      ) : (
                        flexRender(h.column.columnDef.header, h.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-10 text-center text-muted-foreground">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>
          {from}–{to} of {total}
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => set({ page: String(page - 1) }, false)} aria-label="Previous page">
            <ChevronLeft />
          </Button>
          <span>
            Page {page} of {pages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => set({ page: String(page + 1) }, false)} aria-label="Next page">
            <ChevronRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
