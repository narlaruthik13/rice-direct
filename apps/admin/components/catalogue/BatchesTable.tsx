"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import type { AdminBatchListItem, Paginated } from "@kisa/shared";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABEL, MODEL_LABEL, shortDate } from "@/lib/format";
import { ExpiryBadge, StockBadge } from "./bits";

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
    header: "Crop",
    cell: ({ row }) => (
      <span>
        {row.original.variety}
        <span className="block text-xs text-muted-foreground">{CATEGORY_LABEL[row.original.categoryId]}</span>
      </span>
    ),
  },
  {
    header: "Model",
    cell: ({ row }) => <Badge variant="outline">{MODEL_LABEL[row.original.salesModel]}</Badge>,
  },
  {
    header: "Farmer / partner",
    cell: ({ row }) => (
      <span>
        {row.original.farmer.name}
        <span className="block text-xs text-muted-foreground">{row.original.partner.name}</span>
      </span>
    ),
  },
  { header: "Packed", meta: { sortKey: "packedDate" }, cell: ({ row }) => shortDate(row.original.packedDate) },
  {
    header: "Stock",
    meta: { sortKey: "availableKg" },
    cell: ({ row }) => (
      <div className="flex flex-col items-start gap-1">
        <span className="font-semibold">
          {row.original.availableKg.toLocaleString("en-IN")} <span className="font-normal text-muted-foreground">/ {row.original.outputKg.toLocaleString("en-IN")} kg</span>
        </span>
        <div className="flex gap-1">
          <StockBadge status={row.original.stockStatus} />
          <ExpiryBadge daysLeft={row.original.daysLeft} />
        </div>
      </div>
    ),
  },
  { header: "Packs", cell: ({ row }) => row.original.productCount },
];

export function BatchesTable({ data, categories }: { data: Paginated<AdminBatchListItem>; categories: { id: string; name: string }[] }) {
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
        { param: "category", label: "Category", options: [{ value: "", label: "All crops" }, ...categories.map((c) => ({ value: c.id, label: c.name }))] },
        {
          param: "salesModel",
          label: "Sales model",
          options: [
            { value: "", label: "Both models" },
            { value: "FARMER_OWNED", label: "Farmer-owned" },
            { value: "PARTNER_SOURCED", label: "Partner-sourced" },
          ],
        },
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
          label: "Expiry",
          options: [
            { value: "", label: "Any expiry" },
            { value: "true", label: "Expiring in 7 days" },
          ],
        },
      ]}
    />
  );
}
