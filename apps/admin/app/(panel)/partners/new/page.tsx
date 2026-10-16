import type { Metadata } from "next";
import { NoPermission, PageHeader } from "@/components/page";
import { PartnerForm } from "@/components/partners/PartnerForm";
import { Card, CardContent } from "@/components/ui/card";
import { canEdit, getMe } from "@/lib/me";

export const metadata: Metadata = { title: "New partner" };

export default async function NewPartnerPage() {
  const me = await getMe();
  return (
    <div>
      <PageHeader title="New partner" back={{ href: "/partners", label: "Partners" }} />
      {canEdit(me) ? (
        <Card>
          <CardContent className="pt-5">
            <PartnerForm />
          </CardContent>
        </Card>
      ) : (
        <NoPermission what="add partners" />
      )}
    </div>
  );
}
