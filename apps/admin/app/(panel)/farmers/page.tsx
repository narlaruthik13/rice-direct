import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { AdminFarmer, Paginated } from "@kisa/shared";
import { FarmersTable } from "@/components/farmers/FarmersTable";
import { PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { canEdit, getMe } from "@/lib/me";
import { type SearchParams, toQuery } from "@/lib/query";

export const metadata: Metadata = { title: "Farmers" };

export default async function FarmersPage({ searchParams }: { searchParams: SearchParams }) {
  const [me, data] = await Promise.all([
    getMe(),
    apiFetch<Paginated<AdminFarmer>>(`/admin/farmers${toQuery(searchParams, ["search", "status", "sort", "order", "page"])}`),
  ]);
  return (
    <div>
      <PageHeader
        title="Farmers"
        description="The farmers whose produce Kisa sells."
        actions={
          canEdit(me) && (
            <Button asChild>
              <Link href="/farmers/new">
                <Plus aria-hidden="true" />
                New farmer
              </Link>
            </Button>
          )
        }
      />
      <FarmersTable data={data} />
    </div>
  );
}
