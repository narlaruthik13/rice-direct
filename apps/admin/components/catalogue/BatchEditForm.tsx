"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Lock } from "lucide-react";
import { toast } from "sonner";
import { type AdminBatchDetail, type AdminMill, type AdminVariety, type BatchUpdateInput, BatchUpdateSchema, RICE_AGE_LABEL, RICE_AGES, RICE_TYPE_LABEL, RICE_TYPES } from "@kisa/shared";
import { Button } from "@/components/ui/button";
import { Field, Select } from "@/components/ui/form-controls";
import { Input } from "@/components/ui/input";
import { updateBatch } from "@/lib/actions";
import { handleResult } from "@/lib/form-errors";
import { ageLabel, typeLabel } from "@/lib/format";
import { QualityFields } from "./QualityFields";

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

/** Edit a batch with the shared BatchUpdateSchema. Sends only changed fields; the API re-checks the whole batch. */
export function BatchEditForm({ batch, varieties, mills }: { batch: AdminBatchDetail; varieties: AdminVariety[]; mills: AdminMill[] }) {
  const router = useRouter();
  const locked = new Set(batch.lockedFields);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, dirtyFields, isSubmitting, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(BatchUpdateSchema) as never,
    shouldUnregister: true, // locked fields aren't rendered, so they are never sent
    defaultValues: {
      millId: batch.mill.id,
      varietyId: batch.variety.id,
      packedKg: batch.packedKg,
      attributes: { riceType: batch.riceType ?? undefined, age: batch.age ?? undefined },
      millingDate: batch.millingDate,
      packedDate: batch.packedDate,
      bestBefore: batch.bestBefore,
      quality: batch.quality,
    },
  });

  const onSubmit = async (values: Values) => {
    const payload: Record<string, unknown> = {};
    for (const key of Object.keys(dirtyFields) as (keyof Values)[]) payload[key] = values[key];
    if (Object.keys(payload).length === 0) return;
    const result = await updateBatch(batch.id, payload as BatchUpdateInput);
    if (!handleResult(result, setError)) return;
    toast.success("Batch updated");
    router.push(`/catalogue/${batch.id}`);
    router.refresh();
  };

  const e = (p: string) => errorAt(errors, p);
  // Active choices, plus the current one even if it was deactivated since.
  const millOptions = mills.some((m) => m.id === batch.mill.id) ? mills : [{ id: batch.mill.id, name: batch.mill.name } as AdminMill, ...mills];
  const varietyOptions = varieties.some((v) => v.id === batch.variety.id) ? varieties : [{ id: batch.variety.id, name: batch.variety.name } as AdminVariety, ...varieties];

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-8">
      {batch.hasOrders && (
        <p className="flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm">
          <Lock className="size-4" aria-hidden="true" />
          This batch has orders, so its mill, variety, type, age and packed kg can&apos;t change.
        </p>
      )}
      <fieldset disabled={isSubmitting} className="grid gap-4 sm:grid-cols-2">
        {locked.has("millId") ? (
          <Locked label="Mill" value={batch.mill.name} />
        ) : (
          <Field id="millId" label="Mill" error={e("millId")}>
            <Select {...register("millId")}>
              {millOptions.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {locked.has("varietyId") ? (
          <Locked label="Variety" value={batch.variety.name} />
        ) : (
          <Field id="varietyId" label="Variety" error={e("varietyId")}>
            <Select {...register("varietyId")}>
              {varietyOptions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {locked.has("attributes") ? (
          <>
            <Locked label="Type" value={typeLabel(batch.riceType)} />
            <Locked label="Age" value={ageLabel(batch.age)} />
          </>
        ) : (
          <>
            <Field id="attributes.riceType" label="Type" error={e("attributes.riceType")}>
              <Select {...register("attributes.riceType")}>
                {RICE_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {RICE_TYPE_LABEL[t]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="attributes.age" label="Age" error={e("attributes.age")}>
              <Select {...register("attributes.age")}>
                {RICE_AGES.map((a) => (
                  <option key={a} value={a}>
                    {RICE_AGE_LABEL[a]}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        )}
        <Field id="millingDate" label="Milling date" error={e("millingDate")}>
          <Input type="date" {...register("millingDate")} />
        </Field>
        <Field id="packedDate" label="Packed date" error={e("packedDate")} hint="The batch id doesn't change.">
          <Input type="date" {...register("packedDate")} />
        </Field>
        <Field id="bestBefore" label="Best before" error={e("bestBefore")}>
          <Input type="date" {...register("bestBefore")} />
        </Field>
        {locked.has("packedKg") ? (
          <Locked label="Kg packed" value={`${batch.packedKg} kg`} />
        ) : (
          <Field id="packedKg" label="Kg packed" error={e("packedKg")} hint="Stock moves by the same amount.">
            <Input type="number" step="1" {...register("packedKg", { valueAsNumber: true })} />
          </Field>
        )}
      </fieldset>
      <section>
        <h3 className="mb-3 font-display text-lg font-semibold">Quality report</h3>
        <QualityFields register={register} errors={errors} />
      </section>
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
