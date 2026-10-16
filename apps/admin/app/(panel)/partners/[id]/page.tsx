import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { AdminBatchListItem, AdminPartner, Paginated } from "@kisa/shared";
import { ActiveToggle } from "@/components/ActiveToggle";
import { PageHeader } from "@/components/page";
import { PartnerForm } from "@/components/partners/PartnerForm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setPartnerActive } from "@/lib/actions";
import { ApiRequestError, apiFetch } from "@/lib/api";
import { CATEGORY_LABEL, PARTNER_TYPE_LABEL, shortDate } from "@/lib/format";
import { canEdit, getMe } from "@/lib/me";

export const metadata: Metadata = { title: "Partner" };

export default async function PartnerPage({ params }: { params: { id: string } }) {
  const id = encodeURIComponent(params.id);
  const [me, partner, batches] = await Promise.all([
    getMe(),
    apiFetch<AdminPartner>(`/admin/partners/${id}`).catch((e) => {
      if (e instanceof ApiRequestError && e.status === 404) notFound();
      throw e;
    }),
    apiFetch<Paginated<AdminBatchListItem>>(`/admin/batches?partnerId=${id}&pageSize=100`),
  ]);
  const editable = canEdit(me);

  return (
    <div>
      <PageHeader
        back={{ href: "/partners", label: "Partners" }}
        title={partner.name}
        description={
          <span className="inline-flex items-center gap-2">
            {PARTNER_TYPE_LABEL[partner.type]} · {partner.town}
            {partner.isActive ? <Badge variant="secondary">Active</Badge> : <Badge variant="danger">Inactive</Badge>}
          </span>
        }
        actions={
          editable && (
            <ActiveToggle
              isActive={partner.isActive}
              name={partner.name}
              noun="partner"
              consequence="It won't be offered for new batches. Existing batches and products stay on sale."
              action={setPartnerActive.bind(null, partner.id)}
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
            <PartnerForm partner={partner} readOnly={!editable} />
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
                      {CATEGORY_LABEL[b.categoryId]} · {b.variety} · {b.farmer.name} · packed {shortDate(b.packedDate)}
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
