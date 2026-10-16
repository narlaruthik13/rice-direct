"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import type { AdminFarmer, Paginated } from "@kisa/shared";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { METHOD_LABEL } from "@/lib/format";

const columns: ColumnDef<AdminFarmer, unknown>[] = [
  {
    header: "Name",
    meta: { sortKey: "name" },
    cell: ({ row }) => (
      <Link href={`/farmers/${row.original.id}`} className="font-semibold text-field hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  {
    header: "Place",
    meta: { sortKey: "district" },
    cell: ({ row }) => (
      <span>
        {row.original.village}, {row.original.district}
        <span className="block text-xs text-muted-foreground">{row.original.state}</span>
      </span>
    ),
  },
  { header: "Method", cell: ({ row }) => METHOD_LABEL[row.original.method] },
  { header: "Acres", cell: ({ row }) => row.original.acres },
  { header: "Batches", cell: ({ row }) => row.original.batchCount },
  {
    header: "Status",
    cell: ({ row }) => (row.original.isActive ? <Badge variant="secondary">Active</Badge> : <Badge variant="danger">Inactive</Badge>),
  },
];

export function FarmersTable({ data }: { data: Paginated<AdminFarmer> }) {
  return (
    <DataTable
      columns={columns}
      data={data.items}
      total={data.total}
      page={data.page}
      pageSize={data.pageSize}
      defaultSort="name"
      searchPlaceholder="Search name, village, district or phone"
      emptyMessage="No farmers match."
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
