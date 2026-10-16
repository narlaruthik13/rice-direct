"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { type AdminMill, MillInputSchema } from "@kisa/shared";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/form-controls";
import { Input } from "@/components/ui/input";
import { createMill, updateMill } from "@/lib/actions";
import { handleResult } from "@/lib/form-errors";

type Values = z.input<typeof MillInputSchema>;

const splitList = (v: unknown) => (typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : v);

/** Create or edit a partner mill. Read-only for STAFF. Mills are never shown to customers. */
export function MillForm({ mill, readOnly = false }: { mill?: AdminMill; readOnly?: boolean }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values, unknown, z.output<typeof MillInputSchema>>({
    resolver: zodResolver(MillInputSchema),
    defaultValues: mill
      ? {
          name: mill.name,
          contactName: mill.contactName ?? "",
          phone: mill.phone ?? "",
          town: mill.town,
          district: mill.district,
          state: mill.state,
          fssaiLicense: mill.fssaiLicense ?? "",
          certifications: mill.certifications.join(", ") as unknown as string[],
        }
      : { state: "Telangana", contactName: "", phone: "", fssaiLicense: "", certifications: "" as unknown as string[] },
  });

  const onSubmit = async (values: z.output<typeof MillInputSchema>) => {
    const result = mill ? await updateMill(mill.id, values) : await createMill(values);
    if (!handleResult(result, setError)) return;
    toast.success(mill ? "Mill updated" : `Added ${result.data.name}`);
    if (mill) router.refresh();
    else router.push(`/mills/${result.data.id}`);
  };

  const err = (k: keyof Values) => errors[k]?.message as string | undefined;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <fieldset disabled={readOnly || isSubmitting} className="grid gap-4 sm:grid-cols-2">
        <Field id="name" label="Mill name" error={err("name")}>
          <Input {...register("name")} />
        </Field>
        <Field id="contactName" label="Contact person" error={err("contactName")} hint="Optional.">
          <Input {...register("contactName")} />
        </Field>
        <Field id="phone" label="Phone" error={err("phone")} hint="Optional. 10 digits.">
          <Input inputMode="numeric" {...register("phone")} />
        </Field>
        <Field id="fssaiLicense" label="FSSAI licence number" error={err("fssaiLicense")} hint="Optional. 14 digits.">
          <Input inputMode="numeric" {...register("fssaiLicense")} />
        </Field>
        <Field id="town" label="Town" error={err("town")}>
          <Input {...register("town")} />
        </Field>
        <Field id="district" label="District" error={err("district")}>
          <Input {...register("district")} />
        </Field>
        <Field id="state" label="State" error={err("state")}>
          <Input {...register("state")} />
        </Field>
        <Field id="certifications" label="Certifications" error={err("certifications")} hint="Comma-separated, e.g. FSSAI Licensed, ISO 22000">
          <Input {...register("certifications", { setValueAs: splitList })} />
        </Field>
      </fieldset>
      {!readOnly && (
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting || (!!mill && !isDirty)}>
            {isSubmitting && <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />}
            {mill ? "Save changes" : "Add mill"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      )}
    </form>
  );
}
