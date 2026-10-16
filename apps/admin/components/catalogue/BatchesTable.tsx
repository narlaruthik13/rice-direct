"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import { type AdminBatchListItem, type Paginated, RICE_AGE_LABEL, RICE_AGES, RICE_TYPE_LABEL, RICE_TYPES } from "@kisa/shared";
import { DataTable } from "@/components/data-table";
import { ageLabel, shortDate, typeLabel } from "@/lib/format";
import { BestBeforeBadge, StockBadge } from "./bits";

const columns: ColumnDef<AdminBatchListItem, unknown>[] = [
  {
    header: "Batch",
    meta: { sortKey: "id" },
    cell: ({ row }) => (
      <Link href={`/catalogue/${row.original.id}`} className="font-mono text-sm font-semibold text-field hover:underline">
        {row.original.id}
      </Link>
    ),
  },
  {
    header: "Rice",
    cell: ({ row }) => (
      <span>
        {row.original.variety.name}
        <span className="block text-xs text-muted-foreground">
          {typeLabel(row.original.riceType)} · {ageLabel(row.original.age)}
        </span>
      </span>
    ),
  },
  { header: "Mill", cell: ({ row }) => row.original.mill.name },
  { header: "Packed", meta: { sortKey: "packedDate" }, cell: ({ row }) => shortDate(row.original.packedDate) },
  {
    header: "Best before",
    meta: { sortKey: "bestBefore" },
    cell: ({ row }) => (
      <div className="flex flex-col items-start gap-1">
        {shortDate(row.original.bestBefore)}
        <BestBeforeBadge daysLeft={row.original.daysLeft} />
      </div>
    ),
  },
  {
    header: "Stock",
    meta: { sortKey: "availableKg" },
    cell: ({ row }) => (
      <div className="flex flex-col items-start gap-1">
        <span className="font-semibold">
          {row.original.availableKg.toLocaleString("en-IN")} <span className="font-normal text-muted-foreground">/ {row.original.packedKg.toLocaleString("en-IN")} kg</span>
        </span>
        <StockBadge status={row.original.stockStatus} />
      </div>
    ),
  },
  { header: "Packs", cell: ({ row }) => row.original.productCount },
];

export function BatchesTable({
  data,
  varieties,
  mills,
}: {
  data: Paginated<AdminBatchListItem>;
  varieties: { id: string; name: string }[];
  mills: { id: string; name: string }[];
}) {
  return (
    <DataTable
      columns={columns}
      data={data.items}
      total={data.total}
      page={data.page}
      pageSize={data.pageSize}
      defaultSort="packedDate"
      defaultOrder="desc"
      searchPlaceholder="Search batch id or variety"
      emptyMessage="No batches match."
      filters={[
        { param: "varietyId", label: "Variety", options: [{ value: "", label: "All varieties" }, ...varieties.map((v) => ({ value: v.id, label: v.name }))] },
        { param: "riceType", label: "Type", options: [{ value: "", label: "All types" }, ...RICE_TYPES.map((t) => ({ value: t, label: RICE_TYPE_LABEL[t] }))] },
        { param: "age", label: "Age", options: [{ value: "", label: "New and aged" }, ...RICE_AGES.map((a) => ({ value: a, label: RICE_AGE_LABEL[a] }))] },
        { param: "millId", label: "Mill", options: [{ value: "", label: "All mills" }, ...mills.map((m) => ({ value: m.id, label: m.name }))] },
        {
          param: "stock",
          label: "Stock",
          options: [
            { value: "", label: "Any stock" },
            { value: "in_stock", label: "In stock" },
            { value: "low", label: "Low stock" },
            { value: "sold_out", label: "Sold out" },
          ],
        },
        {
          param: "expiringSoon",
          label: "Best before",
          options: [
            { value: "", label: "Any best-before" },
            { value: "true", label: "Within 30 days" },
          ],
        },
      ]}
    />
  );
}
