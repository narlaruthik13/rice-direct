import type { Metadata } from "next";
import { FarmerForm } from "@/components/farmers/FarmerForm";
import { NoPermission, PageHeader } from "@/components/page";
import { Card, CardContent } from "@/components/ui/card";
import { canEdit, getMe } from "@/lib/me";

export const metadata: Metadata = { title: "New farmer" };

export default async function NewFarmerPage() {
  const me = await getMe();
  return (
    <div>
      <PageHeader title="New farmer" back={{ href: "/farmers", label: "Farmers" }} />
      {canEdit(me) ? (
        <Card>
          <CardContent className="pt-5">
            <FarmerForm />
          </CardContent>
        </Card>
      ) : (
        <NoPermission what="add farmers" />
      )}
    </div>
  );
}
