import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { AdminBatchDetail, AdminMill, AdminVariety, Paginated } from "@kisa/shared";
import { BatchEditForm } from "@/components/catalogue/BatchEditForm";
import { NoPermission, PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { ApiRequestError, apiFetch } from "@/lib/api";
import { canEdit, getMe } from "@/lib/me";

export const metadata: Metadata = { title: "Edit batch" };

export default async function EditBatchPage({ params }: { params: { id: string } }) {
  const id = encodeURIComponent(params.id);
  const me = await getMe();
  const back = { href: `/catalogue/${id}`, label: params.id };
  if (!canEdit(me)) {
    return (
      <div>
        <PageHeader title="Edit batch" back={back} />
        <NoPermission what="edit batches" />
      </div>
    );
  }
  const [batch, varieties, mills] = await Promise.all([
    apiFetch<AdminBatchDetail>(`/admin/batches/${id}`).catch((e) => {
      if (e instanceof ApiRequestError && e.status === 404) notFound();
      throw e;
    }),
    apiFetch<Paginated<AdminVariety>>("/admin/varieties?status=active&pageSize=100"),
    apiFetch<Paginated<AdminMill>>("/admin/mills?status=active&pageSize=100"),
  ]);
  return (
    <div>
      <PageHeader title={<>Edit <span className="font-mono">{batch.id}</span></>} back={back} />
      <Card>
        <CardContent className="pt-6">
          <BatchEditForm batch={batch} varieties={varieties.items} mills={mills.items} />
        </CardContent>
      </Card>
    </div>
  );
}
