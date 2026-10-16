import type { Metadata } from "next";
import type { AdminFarmer, AdminPartner, CategorySummary, Paginated } from "@kisa/shared";
import { NewBatchWizard } from "@/components/catalogue/NewBatchWizard";
import { NoPermission, PageHeader } from "@/components/page";
import { apiFetch } from "@/lib/api";
import { canEdit, getMe } from "@/lib/me";

export const metadata: Metadata = { title: "New batch" };

export default async function NewBatchPage() {
  const me = await getMe();
  if (!canEdit(me)) {
    return (
      <div>
        <PageHeader title="New batch" back={{ href: "/catalogue", label: "Batches & Products" }} />
        <NoPermission what="create batches" />
      </div>
    );
  }
  const [categories, farmers, partners] = await Promise.all([
    apiFetch<CategorySummary[]>("/categories"),
    apiFetch<Paginated<AdminFarmer>>("/admin/farmers?status=active&pageSize=100"),
    apiFetch<Paginated<AdminPartner>>("/admin/partners?status=active&pageSize=100"),
  ]);
  return (
    <div>
      <PageHeader title="New batch" description="One farmer's harvest, processed by one partner." back={{ href: "/catalogue", label: "Batches & Products" }} />
      <NewBatchWizard categories={categories} farmers={farmers.items} partners={partners.items} />
    </div>
  );
}
