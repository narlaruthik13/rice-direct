"use client";

import Link from "next/link";
import type { ColumnDef } from "@tanstack/react-table";
import type { AdminVariety, Paginated } from "@kisa/shared";
import { ActiveToggle } from "@/components/ActiveToggle";
import { DataTable } from "@/components/data-table";
import { Badge } from "@/components/ui/badge";
import { setVarietyActive } from "@/lib/actions";
import { VarietyDialog } from "./VarietyDialog";

export function VarietiesTable({ data, canEdit }: { data: Paginated<AdminVariety>; canEdit: boolean }) {
  const columns: ColumnDef<AdminVariety, unknown>[] = [
    { header: "Variety", meta: { sortKey: "name" }, cell: ({ row }) => <span className="font-semibold">{row.original.name}</span> },
    { header: "Link name", cell: ({ row }) => <span className="font-mono text-xs">{row.original.slug}</span> },
    {
      header: "Batches",
      cell: ({ row }) =>
        row.original.batchCount > 0 ? (
          <Link href={`/catalogue?varietyId=${row.original.id}`} className="text-field hover:underline">
            {row.original.batchCount}
          </Link>
        ) : (
          0
        ),
    },
    {
      header: "Status",
      cell: ({ row }) => (row.original.isActive ? <Badge variant="secondary">Active</Badge> : <Badge variant="danger">Inactive</Badge>),
    },
    ...(canEdit
      ? [
          {
            id: "actions",
            header: () => <span className="sr-only">Actions</span>,
            cell: ({ row }) => (
              <div className="flex justify-end gap-1">
                <VarietyDialog variety={row.original} />
                <ActiveToggle
                  isActive={row.original.isActive}
                  name={row.original.name}
                  noun="variety"
                  consequence="Its packs disappear from the shop and it isn't offered for new batches."
                  action={(active) => setVarietyActive(row.original.id, active)}
                />
              </div>
            ),
          } satisfies ColumnDef<AdminVariety, unknown>,
        ]
      : []),
  ];
  return (
    <DataTable
      columns={columns}
      data={data.items}
      total={data.total}
      page={data.page}
      pageSize={data.pageSize}
      defaultSort="name"
      searchPlaceholder="Search varieties"
      emptyMessage="No varieties match."
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
