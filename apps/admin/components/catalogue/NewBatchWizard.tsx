"use client";

// New batch, step by step: mill → variety → type → age → dates → quality → packs →
// review. One form; every step is checked with the shared schemas (BatchCreateSchema,
// RiceAttributesSchema, RiceQualitySchema, batchIssues), and the API re-checks everything.
import { forwardRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { type FieldPath, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  type AdminMill,
  type AdminVariety,
  type BatchCreateInput,
  BatchCreateSchema,
  batchIssues,
  type CategorySummary,
  RICE_AGE_LABEL,
  RICE_AGES,
  RICE_TYPE_LABEL,
  RICE_TYPES,
  RiceAttributesSchema,
  RiceQualitySchema,
} from "@kisa/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Select, Textarea } from "@/components/ui/form-controls";
import { Input } from "@/components/ui/input";
import { createBatch } from "@/lib/actions";
import { handleResult } from "@/lib/form-errors";
import { ageLabel, rupees, shortDate, typeLabel } from "@/lib/format";
import { cn } from "@/lib/utils";
import { QualityFields } from "./QualityFields";
import { PricePreview, priceOf } from "./bits";

type Values = BatchCreateInput;
type Product = NonNullable<Values["products"]>[number];

const STEPS = ["Mill", "Variety", "Type", "Age", "Dates", "Quality", "Packs & prices", "Review"] as const;

const STEP_FIELDS: FieldPath<Values>[][] = [
  ["millId"],
  ["varietyId"],
  ["attributes"],
  ["attributes"],
  ["millingDate", "packedDate", "bestBefore", "packedKg"],
  ["quality"],
  ["products"],
  [],
];

const TYPE_HINT: Record<string, string> = {
  RAW: "Milled straight from dried paddy. Soft, everyday rice.",
  STEAM: "Paddy steamed before milling. Firmer grains that stay separate.",
  BOILED: "Parboiled: soaked, steamed and dried. Holds its shape, keeps well.",
};
const AGE_HINT: Record<string, string> = {
  NEW: "Sold within a few months of milling.",
  AGED: "Stored 6+ months. Cooks fluffier and less sticky.",
};

const today = () => new Date().toISOString().slice(0, 10);
const plusDays = (iso: string, days: number) => new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

function errorAt(errors: unknown, path: string): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return path.split(".").reduce<any>((e, k) => e?.[k], errors)?.message;
}

/** A radio option as a card. Forwards the ref: react-hook-form reads radio values through it. */
const ChoiceCard = forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<"input"> & { children: React.ReactNode }>(function ChoiceCard({ children, ...input }, ref) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-secondary/40 has-[:checked]:border-primary has-[:checked]:bg-secondary/60">
      <input ref={ref} type="radio" className="mt-1 accent-field" {...input} />
      <span>{children}</span>
    </label>
  );
});

export function NewBatchWizard({ category, varieties, mills }: { category: CategorySummary; varieties: AdminVariety[]; mills: AdminMill[] }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [bestBeforeTouched, setBestBeforeTouched] = useState(false);
  const form = useForm<Values>({
    resolver: zodResolver(BatchCreateSchema) as never,
    defaultValues: {
      categoryId: category.id,
      millId: "",
      varietyId: "",
      packedDate: today(),
      bestBefore: plusDays(today(), category.shelfLifeDays),
      attributes: {},
      quality: { grade: "A" },
      products: [],
    },
  });
  const { register, control, handleSubmit, trigger, setValue, setError, clearErrors, getValues, formState } = form;
  const { errors, isSubmitting } = formState;
  const products = useFieldArray({ control, name: "products" });
  const [packedDate, varietyId, riceType, age, watchedProducts] = useWatch({
    control,
    name: ["packedDate", "varietyId", "attributes.riceType", "attributes.age", "products"],
  }) as [string, string, string | undefined, string | undefined, Product[]];
  const variety = varieties.find((v) => v.id === varietyId);

  // Best-before follows the packed date (+ shelf life) until the admin sets it.
  useEffect(() => {
    if (!bestBeforeTouched && packedDate && /^\d{4}-\d{2}-\d{2}$/.test(packedDate)) setValue("bestBefore", plusDays(packedDate, category.shelfLifeDays));
  }, [packedDate, bestBeforeTouched, category.shelfLifeDays, setValue]);

  // Keep each pack's price equal to mill price + Kisa margin (the API requires it).
  useEffect(() => {
    (watchedProducts ?? []).forEach((p, i) => {
      const sum = priceOf(p.millPrice, p.kisaMargin);
      if (p.price !== sum) setValue(`products.${i}.price`, sum);
    });
  }, [watchedProducts, setValue]);

  const packName = () => [age === "AGED" ? "Aged" : "", variety?.name ?? "", riceType ? `, ${typeLabel(riceType)}` : ""].join(" ").replace(/\s+,/, ",").trim();

  const addPack = () =>
    products.append({ name: packName(), bagSizeKg: category.packSizesKg[0], millPrice: 0, kisaMargin: 0, price: 0, description: "", tags: [], featured: false });

  /** Base field errors come from the resolver; the rest from the shared rice and batch rules. */
  const validateStep = async (s: number) => {
    clearErrors();
    let ok = await trigger(STEP_FIELDS[s]);
    const v = getValues();
    const fail = (path: string, message: string) => {
      setError(path as FieldPath<Values>, { message });
      ok = false;
    };
    if (s === 2) {
      const r = RiceAttributesSchema.shape.riceType.safeParse(v.attributes?.riceType);
      if (!r.success) fail("attributes.riceType", r.error.issues[0].message);
    }
    if (s === 3) {
      const r = RiceAttributesSchema.shape.age.safeParse(v.attributes?.age);
      if (!r.success) fail("attributes.age", r.error.issues[0].message);
    }
    if (s === 4) {
      for (const i of batchIssues({ ...v, attributes: {}, quality: {} })) {
        if (["millingDate", "packedDate", "bestBefore"].includes(i.path)) fail(i.path, i.message);
      }
    }
    if (s === 5) {
      const r = RiceQualitySchema.safeParse(v.quality);
      if (!r.success) for (const i of r.error.issues) fail(["quality", ...i.path].join("."), i.message);
    }
    return ok;
  };

  const next = async () => {
    if (!(await validateStep(step))) return;
    if (step === 5 && products.fields.length === 0) addPack(); // start the packs step with one pack
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const onSubmit = async (values: Values) => {
    const result = await createBatch(values);
    if (!handleResult(result, setError)) {
      const failed = (result.ok ? [] : (result.issues ?? [])).map((i) => i.path.split(".")[0]);
      const at = STEP_FIELDS.findIndex((fields) => fields.some((f) => failed.includes(f.split(".")[0])));
      if (at >= 0) setStep(at);
      return;
    }
    toast.success(`Batch ${result.data.id} created`);
    router.push(`/catalogue/${result.data.id}`);
  };

  const e = (p: string) => errorAt(errors, p);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <input type="hidden" {...register("categoryId")} />
      <ol className="mb-6 flex flex-wrap gap-2" aria-label="Steps">
        {STEPS.map((s, i) => (
          <li
            key={s}
            aria-current={i === step ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold",
              i === step ? "border-primary bg-primary text-primary-foreground" : i < step ? "bg-secondary" : "text-muted-foreground",
            )}
          >
            <span className="flex size-4 items-center justify-center">{i < step ? <Check className="size-3" /> : i + 1}</span>
            {s}
          </li>
        ))}
      </ol>

      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-4 text-2xl font-semibold">{STEPS[step]}</h2>

          {/* 1. Mill (admin only; never shown to customers) */}
          <div hidden={step !== 0} className="space-y-3">
            <p className="text-sm text-muted-foreground">The mill that packed this rice in Kisa bags. Recorded for payouts and quality; customers never see it.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {mills.map((m) => (
                <ChoiceCard key={m.id} value={m.id} {...register("millId")}>
                  <span className="font-display text-lg font-semibold">{m.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {m.town}, {m.district}
                  </span>
                </ChoiceCard>
              ))}
            </div>
            {e("millId") && <p className="text-sm text-destructive">{e("millId")}</p>}
          </div>

          {/* 2. Variety */}
          <div hidden={step !== 1} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              {varieties.map((v) => (
                <ChoiceCard key={v.id} value={v.id} {...register("varietyId")}>
                  <span className="font-display text-lg font-semibold">{v.name}</span>
                </ChoiceCard>
              ))}
            </div>
            {e("varietyId") && <p className="text-sm text-destructive">{e("varietyId")}</p>}
          </div>

          {/* 3. Type */}
          <div hidden={step !== 2} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              {RICE_TYPES.map((t) => (
                <ChoiceCard key={t} value={t} {...register("attributes.riceType")}>
                  <span className="font-display text-lg font-semibold">{RICE_TYPE_LABEL[t]}</span>
                  <span className="block text-sm text-muted-foreground">{TYPE_HINT[t]}</span>
                </ChoiceCard>
              ))}
            </div>
            {e("attributes.riceType") && <p className="text-sm text-destructive">{e("attributes.riceType")}</p>}
          </div>

          {/* 4. Age */}
          <div hidden={step !== 3} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              {RICE_AGES.map((a) => (
                <ChoiceCard key={a} value={a} {...register("attributes.age")}>
                  <span className="font-display text-lg font-semibold">{RICE_AGE_LABEL[a]}</span>
                  <span className="block text-sm text-muted-foreground">{AGE_HINT[a]}</span>
                </ChoiceCard>
              ))}
            </div>
            {e("attributes.age") && <p className="text-sm text-destructive">{e("attributes.age")}</p>}
          </div>

          {/* 5. Dates and kg */}
          <div hidden={step !== 4} className="grid gap-4 sm:grid-cols-2">
            <Field id="millingDate" label="Milling date" error={e("millingDate")}>
              <Input type="date" {...register("millingDate")} />
            </Field>
            <Field id="packedDate" label="Packed date" error={e("packedDate")} hint="The batch id uses this date.">
              <Input type="date" {...register("packedDate")} />
            </Field>
            <Field id="bestBefore" label="Best before" error={e("bestBefore")} hint={`Defaults to ${category.shelfLifeDays} days after packing. Not sold from this date.`}>
              <Input type="date" {...register("bestBefore", { onChange: () => setBestBeforeTouched(true) })} />
            </Field>
            <Field id="packedKg" label="Kg packed in Kisa bags" error={e("packedKg")} hint="Becomes the batch's stock.">
              <Input type="number" step="1" min="1" {...register("packedKg", { valueAsNumber: true })} />
            </Field>
          </div>

          {/* 6. Quality */}
          <div hidden={step !== 5} className="space-y-3">
            <p className="text-sm text-muted-foreground">Shown to customers on the Quality Passport.</p>
            <QualityFields register={register} errors={errors} />
          </div>

          {/* 7. Packs and prices */}
          <div hidden={step !== 6} className="space-y-4">
            <p className="text-sm text-muted-foreground">Prices are per pack. Customer price = mill price + Kisa margin; customers see only the total.</p>
            {products.fields.map((field, i) => {
              const p = (watchedProducts?.[i] ?? field) as Product;
              return (
                <div key={field.id} className="rounded-lg border p-4" data-testid={`pack-${i}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold">Pack {i + 1}</h3>
                    <Button type="button" variant="ghost" size="sm" onClick={() => products.remove(i)} aria-label={`Remove pack ${i + 1}`}>
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field id={`products.${i}.name`} label="Product name" error={e(`products.${i}.name`)}>
                        <Input {...register(`products.${i}.name`)} />
                      </Field>
                      <Field id={`products.${i}.bagSizeKg`} label="Pack size" error={e(`products.${i}.bagSizeKg`)}>
                        <Select {...register(`products.${i}.bagSizeKg`, { valueAsNumber: true })}>
                          {category.packSizesKg.map((kg) => (
                            <option key={kg} value={kg}>
                              {kg} kg
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field id={`products.${i}.millPrice`} label="Mill price (₹ per pack)" error={e(`products.${i}.millPrice`)}>
                        <Input type="number" step="0.01" min="0" {...register(`products.${i}.millPrice`, { valueAsNumber: true })} />
                      </Field>
                      <Field id={`products.${i}.kisaMargin`} label="Kisa margin (₹ per pack)" error={e(`products.${i}.kisaMargin`)}>
                        <Input type="number" step="0.01" min="0" {...register(`products.${i}.kisaMargin`, { valueAsNumber: true })} />
                      </Field>
                      <input type="hidden" {...register(`products.${i}.price`, { valueAsNumber: true })} />
                      <Field id={`products.${i}.description`} label="Description" error={e(`products.${i}.description`) ?? e(`products.${i}.price`)} className="sm:col-span-2">
                        <Textarea rows={2} {...register(`products.${i}.description`)} />
                      </Field>
                    </div>
                    <PricePreview millPrice={p.millPrice} kisaMargin={p.kisaMargin} />
                  </div>
                </div>
              );
            })}
            <Button type="button" variant="outline" onClick={addPack} disabled={products.fields.length >= 10}>
              <Plus aria-hidden="true" />
              Add a pack
            </Button>
          </div>

          {/* 8. Review */}
          {step === 7 && <Review values={getValues()} varieties={varieties} mills={mills} />}
        </CardContent>
      </Card>

      <div className="mt-4 flex justify-between gap-2">
        <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0 || isSubmitting}>
          <ChevronLeft aria-hidden="true" />
          Back
        </Button>
        {/* Distinct keys: React must mount a new submit button rather than turn the clicked
            "Next" button into one mid-click, or that click would submit the form and skip Review. */}
        {step < STEPS.length - 1 ? (
          <Button key="next" type="button" onClick={next}>
            Next
            <ChevronRight aria-hidden="true" />
          </Button>
        ) : (
          <Button key="submit" type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />}
            Create batch
          </Button>
        )}
      </div>
    </form>
  );
}

function Review({ values, varieties, mills }: { values: Values; varieties: AdminVariety[]; mills: AdminMill[] }) {
  const attrs = values.attributes as { riceType?: string; age?: string };
  const rows: [string, string][] = [
    ["Mill (admin only)", mills.find((m) => m.id === values.millId)?.name ?? "–"],
    ["Variety", varieties.find((v) => v.id === values.varietyId)?.name ?? "–"],
    ["Type / age", `${typeLabel(attrs.riceType)} · ${ageLabel(attrs.age)}`],
    ["Milled / packed", `${shortDate(values.millingDate)} / ${shortDate(values.packedDate)}`],
    ["Best before", values.bestBefore ? shortDate(values.bestBefore) : "–"],
    ["Packed", `${values.packedKg} kg (stock starts at ${values.packedKg} kg)`],
  ];
  return (
    <div className="space-y-4">
      <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{k}</dt>
            <dd className="text-sm">{v}</dd>
          </div>
        ))}
      </dl>
      <div>
        <h3 className="font-display text-lg font-semibold">Packs</h3>
        {(values.products ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No packs yet. You can add them on the batch page later.</p>
        ) : (
          <ul className="mt-1 divide-y">
            {(values.products ?? []).map((p, i) => (
              <li key={i} className="flex justify-between py-2 text-sm">
                <span>
                  {p.name} · {p.bagSizeKg} kg
                </span>
                <span>
                  <span className="text-muted-foreground">
                    {rupees(p.millPrice)} + {rupees(p.kisaMargin)} ={" "}
                  </span>
                  <span className="font-semibold">{rupees(p.price)}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-sm text-muted-foreground">The batch id (KS-YYYY-MMDD-XX) is generated when you create it.</p>
    </div>
  );
}
