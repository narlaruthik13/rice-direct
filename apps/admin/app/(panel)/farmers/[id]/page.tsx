import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { AdminBatchListItem, AdminFarmer, Paginated } from "@kisa/shared";
import { ActiveToggle } from "@/components/ActiveToggle";
import { FarmerForm } from "@/components/farmers/FarmerForm";
import { PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setFarmerActive } from "@/lib/actions";
import { ApiRequestError, apiFetch } from "@/lib/api";
import { CATEGORY_LABEL, shortDate } from "@/lib/format";
import { canEdit, getMe } from "@/lib/me";

export const metadata: Metadata = { title: "Farmer" };

export default async function FarmerPage({ params }: { params: { id: string } }) {
  const id = encodeURIComponent(params.id);
  const [me, farmer, batches] = await Promise.all([
    getMe(),
    apiFetch<AdminFarmer>(`/admin/farmers/${id}`).catch((e) => {
      if (e instanceof ApiRequestError && e.status === 404) notFound();
      throw e;
    }),
    apiFetch<Paginated<AdminBatchListItem>>(`/admin/batches?farmerId=${id}&pageSize=100`),
  ]);
  const editable = canEdit(me);

  return (
    <div>
      <PageHeader
        back={{ href: "/farmers", label: "Farmers" }}
        title={farmer.name}
        description={
          <span className="inline-flex items-center gap-2">
            {farmer.village}, {farmer.district}
            {farmer.isActive ? <Badge variant="secondary">Active</Badge> : <Badge variant="danger">Inactive</Badge>}
          </span>
        }
        actions={
          editable && (
            <ActiveToggle
              isActive={farmer.isActive}
              name={farmer.name}
              noun="farmer"
              consequence="They won't be offered for new batches. Existing batches and products stay on sale."
              action={setFarmerActive.bind(null, farmer.id)}
            />
          )
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card>
          <CardHeader>
            <CardTitle>{editable ? "Edit details" : "Details"}</CardTitle>
          </CardHeader>
          <CardContent>
            <FarmerForm farmer={farmer} readOnly={!editable} />
          </CardContent>
        </Card>
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Batches</CardTitle>
          </CardHeader>
          <CardContent>
            {batches.items.length === 0 ? (
              <p className="text-sm text-muted-foreground">No batches yet.</p>
            ) : (
              <ul className="divide-y">
                {batches.items.map((b) => (
                  <li key={b.id} className="py-2">
                    <Link href={`/catalogue/${b.id}`} className="font-mono text-sm font-semibold text-field hover:underline">
                      {b.id}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {CATEGORY_LABEL[b.categoryId]} · {b.variety} · packed {shortDate(b.packedDate)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
