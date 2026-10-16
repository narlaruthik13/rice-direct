import type { Metadata } from "next";
import { MillForm } from "@/components/mills/MillForm";
import { NoPermission, PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { canEdit, getMe } from "@/lib/me";

export const metadata: Metadata = { title: "New mill" };

export default async function NewMillPage() {
  const me = await getMe();
  return (
    <div>
      <PageHeader title="New mill" back={{ href: "/mills", label: "Mills" }} />
      {canEdit(me) ? (
        <Card>
          <CardContent className="pt-5">
            <MillForm />
          </CardContent>
        </Card>
      ) : (
        <NoPermission what="add mills" />
      )}
    </div>
  );
}
