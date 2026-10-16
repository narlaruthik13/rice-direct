"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import type { AdminMill, Paginated } from "@kisa/shared";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";

const columns: ColumnDef<AdminMill, unknown>[] = [
  {
    header: "Mill",
    meta: { sortKey: "name" },
    cell: ({ row }) => (
      <Link href={`/mills/${row.original.id}`} className="font-semibold text-field hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  {
    header: "Town",
    meta: { sortKey: "town" },
    cell: ({ row }) => (
      <span>
        {row.original.town}
        <span className="block text-xs text-muted-foreground">
          {row.original.district}, {row.original.state}
        </span>
      </span>
    ),
  },
  { header: "Contact", cell: ({ row }) => row.original.contactName ?? "–" },
  { header: "FSSAI", cell: ({ row }) => <span className="font-mono text-xs">{row.original.fssaiLicense ?? "–"}</span> },
  { header: "Batches", cell: ({ row }) => row.original.batchCount },
  {
    header: "Status",
    cell: ({ row }) => (row.original.isActive ? <Badge variant="secondary">Active</Badge> : <Badge variant="danger">Inactive</Badge>),
  },
];

export function MillsTable({ data }: { data: Paginated<AdminMill> }) {
  return (
    <DataTable
      columns={columns}
      data={data.items}
      total={data.total}
      page={data.page}
      pageSize={data.pageSize}
      defaultSort="name"
      searchPlaceholder="Search mill, town, district or contact"
      emptyMessage="No mills match."
      filters={[
        {
          param: "status",
          label: "Status",
          defaultValue: "active",
          options: [
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
            { value: "all", label: "All" },
          ],
        },
      ]}
    />
  );
}
