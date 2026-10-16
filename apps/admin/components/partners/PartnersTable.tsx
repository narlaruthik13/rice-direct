"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import type { AdminPartner, Paginated } from "@kisa/shared";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { PARTNER_TYPE_LABEL, rupees } from "@/lib/format";

const columns: ColumnDef<AdminPartner, unknown>[] = [
  {
    header: "Name",
    meta: { sortKey: "name" },
    cell: ({ row }) => (
      <Link href={`/partners/${row.original.id}`} className="font-semibold text-field hover:underline">
        {row.original.name}
      </Link>
    ),
  },
  { header: "Type", cell: ({ row }) => PARTNER_TYPE_LABEL[row.original.type] },
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
  { header: "Fee / kg", meta: { sortKey: "processingFeePerKg" }, cell: ({ row }) => rupees(row.original.processingFeePerKg) },
  { header: "Batches", cell: ({ row }) => row.original.batchCount },
  {
    header: "Status",
    cell: ({ row }) => (row.original.isActive ? <Badge variant="secondary">Active</Badge> : <Badge variant="danger">Inactive</Badge>),
  },
];

export function PartnersTable({ data }: { data: Paginated<AdminPartner> }) {
  return (
    <DataTable
      columns={columns}
      data={data.items}
      total={data.total}
      page={data.page}
      pageSize={data.pageSize}
      defaultSort="name"
      searchPlaceholder="Search name, town or district"
      emptyMessage="No partners match."
      filters={[
        {
          param: "type",
          label: "Type",
          options: [
            { value: "", label: "All types" },
            { value: "MILL", label: "Rice mills" },
            { value: "PACKHOUSE", label: "Onion packhouses" },
          ],
        },
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
