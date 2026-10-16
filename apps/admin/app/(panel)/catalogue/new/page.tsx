import type { Metadata } from "next";
import type { AdminMill, AdminVariety, CategorySummary, Paginated } from "@kisa/shared";
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
  const [categories, varieties, mills] = await Promise.all([
    apiFetch<CategorySummary[]>("/categories"),
    apiFetch<Paginated<AdminVariety>>("/admin/varieties?status=active&pageSize=100"),
    apiFetch<Paginated<AdminMill>>("/admin/mills?status=active&pageSize=100"),
  ]);
  const rice = categories.find((c) => c.id === "rice") ?? categories[0];
  return (
    <div>
      <PageHeader title="New batch" description="One lot of rice packed by one mill in Kisa bags." back={{ href: "/catalogue", label: "Batches & Products" }} />
      <NewBatchWizard category={rice} varieties={varieties.items} mills={mills.items} />
    </div>
  );
}
