"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { ActionResult } from "@/lib/actions";
import { handleResult } from "@/lib/form-errors";

/** Deactivate (with a confirm step) or reactivate a record. Soft only: nothing is deleted. */
export function ActiveToggle({
  isActive,
  name,
  noun,
  consequence,
  action,
}: {
  isActive: boolean;
  name: string;
  noun: string;
  consequence: string;
  action: (active: boolean) => Promise<ActionResult<unknown>>;
}) {
  const router = useRouter();
  const run = async (active: boolean) => {
    const result = await action(active);
    if (!handleResult(result)) return false;
    toast.success(active ? `${name} reactivated` : `${name} deactivated`);
    router.refresh();
    return true;
  };

  if (!isActive) {
    return (
      <Button variant="outline" onClick={() => run(true)}>
        Reactivate
      </Button>
    );
  }
  return (
    <ConfirmDialog
      trigger={<Button variant="outline">Deactivate</Button>}
      title={`Deactivate ${name}?`}
      description={`${consequence} Nothing is deleted; you can reactivate this ${noun} at any time.`}
      confirmLabel="Deactivate"
      destructive
      onConfirm={() => run(false)}
    />
  );
}
