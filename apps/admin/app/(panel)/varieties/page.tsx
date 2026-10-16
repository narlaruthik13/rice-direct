import type { Metadata } from "next";
import type { AdminVariety, Paginated } from "@kisa/shared";
import { PageHeader } from "@/components/page";
import { VarietiesTable } from "@/components/varieties/VarietiesTable";
import { VarietyDialog } from "@/components/varieties/VarietyDialog";
import { apiFetch } from "@/lib/api";
import { canEdit, getMe } from "@/lib/me";
import { type SearchParams, toQuery } from "@/lib/query";

export const metadata: Metadata = { title: "Varieties" };

export default async function VarietiesPage({ searchParams }: { searchParams: SearchParams }) {
  const [me, data] = await Promise.all([
    getMe(),
    apiFetch<Paginated<AdminVariety>>(`/admin/varieties${toQuery(searchParams, ["search", "status", "sort", "order", "page"])}`),
  ]);
  const editable = canEdit(me);
  return (
    <div>
      <PageHeader
        title="Varieties"
        description="The rice varieties Kisa sells. Shown to customers and used in the shop's filters."
        actions={editable && <VarietyDialog />}
      />
      <VarietiesTable data={data} canEdit={editable} />
    </div>
  );
}
