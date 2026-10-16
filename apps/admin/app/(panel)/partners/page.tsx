import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { AdminPartner, Paginated } from "@kisa/shared";
import { PageHeader } from "@/components/page";
import { PartnersTable } from "@/components/partners/PartnersTable";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { canEdit, getMe } from "@/lib/me";
import { type SearchParams, toQuery } from "@/lib/query";

export const metadata: Metadata = { title: "Partners" };

export default async function PartnersPage({ searchParams }: { searchParams: SearchParams }) {
  const [me, data] = await Promise.all([
    getMe(),
    apiFetch<Paginated<AdminPartner>>(`/admin/partners${toQuery(searchParams, ["search", "status", "type", "sort", "order", "page"])}`),
  ]);
  return (
    <div>
      <PageHeader
        title="Partners"
        description="Rice mills and onion packhouses that process for Kisa."
        actions={
          canEdit(me) && (
            <Button asChild>
              <Link href="/partners/new">
                <Plus aria-hidden="true" />
                New partner
              </Link>
            </Button>
          )
        }
      />
      <PartnersTable data={data} />
    </div>
  );
}
