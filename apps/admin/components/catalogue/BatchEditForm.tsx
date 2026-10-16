"use client";

import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { type AdminBatchDetail, type AdminFarmer, type AdminPartner, type BatchUpdateInput, BatchUpdateSchema, CROPS, isCategoryId } from "@kisa/shared";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/form-controls";
import { Input } from "@/components/ui/input";
import { updateBatch } from "@/lib/actions";
import { handleResult } from "@/lib/form-errors";
import { MODEL_LABEL } from "@/lib/format";
import { CropFields } from "./CropFields";

type Values = BatchUpdateInput;

function errorAt(errors: unknown, path: string): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return path.split(".").reduce<any>((e, k) => e?.[k], errors)?.message;
}

/** A locked field: shown, never sent. */
function Locked({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1.5">
      <span className="flex items-center gap-1 text-sm font-semibold">
        {label} <Lock className="size-3 text-muted-foreground" aria-label="locked" />
      </span>
      <p className="flex h-10 items-center rounded-md border bg-secondary/50 px-3 text-sm">{value}</p>
    </div>
  );
}

/** Edit a batch. Sends only changed fields; the API re-checks the whole batch. */
export function BatchEditForm({ batch, farmers, partners }: { batch: AdminBatchDetail; farmers: AdminFarmer[]; partners: AdminPartner[] }) {
  const router = useRouter();
  const crop = isCategoryId(batch.categoryId) ? CROPS[batch.categoryId] : undefined;
  const locked = new Set(batch.lockedFields);
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, dirtyFields, isSubmitting, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(BatchUpdateSchema) as never,
    shouldUnregister: true,
    defaultValues: {
      ...(locked.has("salesModel") ? {} : { salesModel: batch.salesModel }),
      ...(locked.has("farmerId") ? {} : { farmerId: batch.farmer.id }),
      ...(locked.has("partnerId") ? {} : { partnerId: batch.partner.id }),
      ...(locked.has("outputKg") ? {} : { outputKg: batch.outputKg }),
      variety: batch.variety,
      harvestDate: batch.harvestDate,
      packedDate: batch.packedDate,
      inputKg: batch.inputKg,
      purchase: batch.purchase ?? undefined,
      shelfLifeDays: batch.shelfLifeDays ?? undefined,
      attributes: batch.attributes,
      quality: batch.quality,
    },
  });
  const salesModel = useWatch({ control, name: "salesModel" }) ?? batch.salesModel;

  const onSubmit = async (values: Values) => {
    const payload: Record<string, unknown> = {};
    for (const key of Object.keys(dirtyFields) as (keyof Values)[]) payload[key] = values[key];
    // Switching to farmer-owned drops the purchase.
    if (salesModel === "FARMER_OWNED" && batch.purchase) payload.purchase = null;
    if (Object.keys(payload).length === 0) return;
    const result = await updateBatch(batch.id, payload as BatchUpdateInput);
    if (!handleResult(result, setError)) return;
    toast.success("Batch updated");
    router.push(`/catalogue/${batch.id}`);
    router.refresh();
  };

  const e = (p: string) => errorAt(errors, p);
  const farmerName = (id: string) => farmers.find((f) => f.id === id)?.name ?? batch.farmer.name;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      {batch.hasOrders && (
        <p className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm">
          <Lock className="size-4" aria-hidden="true" />
          This batch has orders, so its sales model, farmer, partner and output can&apos;t change.
        </p>
      )}
      <fieldset disabled={isSubmitting} className="grid gap-4 sm:grid-cols-2">
        {locked.has("salesModel") ? (
          <Locked label="Sales model" value={MODEL_LABEL[batch.salesModel]} />
        ) : (
          <Field id="salesModel" label="Sales model" error={e("salesModel")}>
            <Select {...register("salesModel")}>
              <option value="FARMER_OWNED">Farmer-owned</option>
              <option value="PARTNER_SOURCED">Partner-sourced</option>
            </Select>
          </Field>
        )}
        <Field id="variety" label="Variety" error={e("variety")}>
          <Select {...register("variety")}>
            {(crop?.varieties ?? [batch.variety]).map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </Select>
        </Field>
        {locked.has("farmerId") ? (
          <Locked label="Farmer" value={farmerName(batch.farmer.id)} />
        ) : (
          <Field id="farmerId" label="Farmer" error={e("farmerId")}>
            <Select {...register("farmerId")}>
              {farmers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} · {f.village}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {locked.has("partnerId") ? (
          <Locked label="Partner" value={batch.partner.name} />
        ) : (
          <Field id="partnerId" label="Partner" error={e("partnerId")}>
            <Select {...register("partnerId")}>
              {partners
                .filter((p) => p.type === crop?.partnerType)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </Select>
          </Field>
        )}
        <Field id="harvestDate" label="Harvest date" error={e("harvestDate")}>
          <Input type="date" {...register("harvestDate")} />
        </Field>
        <Field id="packedDate" label="Packed date" error={e("packedDate")} hint="The batch id doesn't change.">
          <Input type="date" {...register("packedDate")} />
        </Field>
        <Field id="inputKg" label="Raw in (kg)" error={e("inputKg")}>
          <Input type="number" step="1" {...register("inputKg", { valueAsNumber: true })} />
        </Field>
        {locked.has("outputKg") ? (
          <Locked label="Sellable out (kg)" value={`${batch.outputKg} kg`} />
        ) : (
          <Field id="outputKg" label="Sellable out (kg)" error={e("outputKg")} hint="Stock moves by the same amount.">
            <Input type="number" step="1" {...register("outputKg", { valueAsNumber: true })} />
          </Field>
        )}
        {salesModel === "PARTNER_SOURCED" && (
          <>
            <Field id="purchase.date" label="Bought from the farmer on" error={e("purchase.date") ?? e("purchase")}>
              <Input type="date" {...register("purchase.date")} />
            </Field>
            <Field id="purchase.pricePerKg" label="Price paid (₹ per raw kg)" error={e("purchase.pricePerKg")}>
              <Input type="number" step="0.01" {...register("purchase.pricePerKg", { valueAsNumber: true })} />
            </Field>
          </>
        )}
        {crop?.needsShelfLife && (
          <Field id="shelfLifeDays" label="Shelf life (days)" error={e("shelfLifeDays")}>
            <Input type="number" step="1" {...register("shelfLifeDays", { valueAsNumber: true })} />
          </Field>
        )}
      </fieldset>
      <CropFields categoryId={batch.categoryId} register={register} errors={errors} />
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting && <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />}
          Save changes
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
