import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { AdminMill, Paginated } from "@kisa/shared";
import { MillsTable } from "@/components/mills/MillsTable";
import { PageHeader } from "@/components/page";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { canEdit, getMe } from "@/lib/me";
import { type SearchParams, toQuery } from "@/lib/query";

export const metadata: Metadata = { title: "Mills" };

export default async function MillsPage({ searchParams }: { searchParams: SearchParams }) {
  const [me, data] = await Promise.all([
    getMe(),
    apiFetch<Paginated<AdminMill>>(`/admin/mills${toQuery(searchParams, ["search", "status", "sort", "order", "page"])}`),
  ]);
  return (
    <div>
      <PageHeader
        title="Mills"
        description="Partner mills that pack rice in Kisa bags. Admin only: never shown to customers."
        actions={
          canEdit(me) && (
            <Button asChild>
              <Link href="/mills/new">
                <Plus aria-hidden="true" />
                New mill
              </Link>
            </Button>
          )
        }
      />
      <MillsTable data={data} />
    </div>
  );
}
