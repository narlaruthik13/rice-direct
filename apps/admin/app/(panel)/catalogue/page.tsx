import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { AdminBatchListItem, CategorySummary, Paginated } from "@kisa/shared";
import { BatchesTable } from "@/components/catalogue/BatchesTable";
import { PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { canEdit, getMe } from "@/lib/me";
import { type SearchParams, toQuery } from "@/lib/query";

export const metadata: Metadata = { title: "Batches & Products" };

export default async function CataloguePage({ searchParams }: { searchParams: SearchParams }) {
  const query = toQuery(searchParams, ["search", "category", "salesModel", "farmerId", "partnerId", "stock", "expiringSoon", "sort", "order", "page"]);
  const [me, data, categories] = await Promise.all([
    getMe(),
    apiFetch<Paginated<AdminBatchListItem>>(`/admin/batches${query}`),
    apiFetch<CategorySummary[]>("/categories"),
  ]);
  return (
    <div>
      <PageHeader
        title="Batches & Products"
        description="Every traceable lot, its packs and its stock."
        actions={
          canEdit(me) && (
            <Button asChild>
              <Link href="/catalogue/new">
                <Plus aria-hidden="true" />
                New batch
              </Link>
            </Button>
          )
        }
      />
      <BatchesTable data={data} categories={categories} />
    </div>
  );
}
