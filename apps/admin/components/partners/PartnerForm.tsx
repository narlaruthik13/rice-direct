"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { type AdminPartner, PartnerInputSchema } from "@kisa/shared";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/form-controls";
import { Input } from "@/components/ui/input";
import { createPartner, updatePartner } from "@/lib/actions";
import { handleResult } from "@/lib/form-errors";

type Values = z.input<typeof PartnerInputSchema>;

const splitList = (v: unknown) =>
  typeof v === "string" ? v.split(",").map((s) => s.trim()).filter(Boolean) : v;

/** Create or edit a mill or packhouse. Read-only for STAFF. */
export function PartnerForm({ partner, readOnly = false }: { partner?: AdminPartner; readOnly?: boolean }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values, unknown, z.output<typeof PartnerInputSchema>>({
    resolver: zodResolver(PartnerInputSchema),
    defaultValues: partner
      ? {
          type: partner.type,
          name: partner.name,
          phone: partner.phone ?? "",
          town: partner.town,
          district: partner.district,
          state: partner.state,
          processingFeePerKg: partner.processingFeePerKg,
          certifications: partner.certifications.join(", ") as unknown as string[],
          established: partner.established,
        }
      : { type: "MILL", state: "Telangana", phone: "", certifications: "" as unknown as string[] },
  });

  const onSubmit = async (values: z.output<typeof PartnerInputSchema>) => {
    const result = partner ? await updatePartner(partner.id, values) : await createPartner(values);
    if (!handleResult(result, setError)) return;
    toast.success(partner ? "Partner updated" : `Added ${result.data.name}`);
    if (partner) router.refresh();
    else router.push(`/partners/${result.data.id}`);
  };

  const err = (k: keyof Values) => errors[k]?.message as string | undefined;
  const typeLocked = !!partner && partner.batchCount > 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {typeLocked && <input type="hidden" {...register("type")} />}
      <fieldset disabled={readOnly || isSubmitting} className="grid gap-4 sm:grid-cols-2">
        <Field id="type" label="Type" error={err("type")} hint={typeLocked ? "Locked: this partner already has batches." : "Mills process rice; packhouses process onions."}>
          {typeLocked ? (
            // Shown disabled; the value is sent from the hidden input below.
            <Select value={partner.type} disabled onChange={() => undefined}>
              <option value="MILL">Rice mill</option>
              <option value="PACKHOUSE">Onion packhouse</option>
            </Select>
          ) : (
            <Select {...register("type")}>
              <option value="MILL">Rice mill</option>
              <option value="PACKHOUSE">Onion packhouse</option>
            </Select>
          )}
        </Field>
        <Field id="name" label="Name" error={err("name")}>
          <Input {...register("name")} />
        </Field>
        <Field id="processingFeePerKg" label="Processing fee (₹ per kg)" error={err("processingFeePerKg")} hint="Charged to the farmer for farmer-owned batches.">
          <Input type="number" step="0.01" min="0" {...register("processingFeePerKg", { valueAsNumber: true })} />
        </Field>
        <Field id="phone" label="Phone" error={err("phone")} hint="Optional. 10 digits.">
          <Input inputMode="numeric" {...register("phone")} />
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
        <Field id="established" label="Established (year)" error={err("established")}>
          <Input type="number" step="1" {...register("established", { valueAsNumber: true })} />
        </Field>
        <Field id="certifications" label="Certifications" error={err("certifications")} hint="Comma-separated, e.g. FSSAI Licensed, ISO 22000" className="sm:col-span-2">
          <Input {...register("certifications", { setValueAs: splitList })} />
        </Field>
      </fieldset>
      {!readOnly && (
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting || (!!partner && !isDirty)}>
            {isSubmitting && <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />}
            {partner ? "Save changes" : "Add partner"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      )}
    </form>
  );
}
