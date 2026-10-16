import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { AdminBatchListItem, AdminMill, Paginated } from "@kisa/shared";
import { ActiveToggle } from "@/components/ActiveToggle";
import { MillForm } from "@/components/mills/MillForm";
import { PageHeader } from "@/components/page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setMillActive } from "@/lib/actions";
import { ApiRequestError, apiFetch } from "@/lib/api";
import { shortDate, typeLabel } from "@/lib/format";
import { canEdit, getMe } from "@/lib/me";

export const metadata: Metadata = { title: "Mill" };

export default async function MillPage({ params }: { params: { id: string } }) {
  const id = encodeURIComponent(params.id);
  const [me, mill, batches] = await Promise.all([
    getMe(),
    apiFetch<AdminMill>(`/admin/mills/${id}`).catch((e) => {
      if (e instanceof ApiRequestError && e.status === 404) notFound();
      throw e;
    }),
    apiFetch<Paginated<AdminBatchListItem>>(`/admin/batches?millId=${id}&pageSize=100`),
  ]);
  const editable = canEdit(me);

  return (
    <div>
      <PageHeader
        back={{ href: "/mills", label: "Mills" }}
        title={mill.name}
        description={
          <span className="inline-flex items-center gap-2">
            {mill.town}, {mill.district}
            {mill.isActive ? <Badge variant="secondary">Active</Badge> : <Badge variant="danger">Inactive</Badge>}
          </span>
        }
        actions={
          editable && (
            <ActiveToggle
              isActive={mill.isActive}
              name={mill.name}
              noun="mill"
              consequence="It won't be offered for new batches. Existing batches and packs stay on sale."
              action={setMillActive.bind(null, mill.id)}
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
            <MillForm mill={mill} readOnly={!editable} />
          </CardContent>
        </Card>
        <Card className="self-start">
          <CardHeader>
            <CardTitle>Batches packed</CardTitle>
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
                      {b.variety.name} · {typeLabel(b.riceType)} · packed {shortDate(b.packedDate)}
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
