"use client";

// New batch, step by step: category → sales model → farmer and partner → variety,
// dates and kg → crop details → packs and prices → review. One form, validated per
// step with the shared BatchCreateSchema; the API re-checks everything.
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { type FieldPath, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronLeft, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { type AdminFarmer, type AdminPartner, type BatchCreateInput, BatchCreateSchema, type CategorySummary, CROPS, isCategoryId } from "@kisa/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Select, Textarea } from "@/components/ui/form-controls";
import { Input } from "@/components/ui/input";
import { createBatch } from "@/lib/actions";
import { handleResult } from "@/lib/form-errors";
import { CATEGORY_LABEL, MODEL_LABEL, rupees } from "@/lib/format";
import { cn } from "@/lib/utils";
import { CropFields } from "./CropFields";
import { PricePreview, partLabels, sumParts } from "./bits";

type Values = BatchCreateInput;
type Product = NonNullable<Values["products"]>[number];

const STEPS = ["Category", "Sales model", "Farmer & partner", "Variety, dates & kg", "Crop details", "Packs & prices", "Review"] as const;

const STEP_FIELDS: FieldPath<Values>[][] = [
  ["categoryId"],
  ["salesModel"],
  ["farmerId", "partnerId"],
  ["variety", "harvestDate", "packedDate", "inputKg", "outputKg", "purchase", "shelfLifeDays"],
  ["attributes", "quality"],
  ["products"],
  [],
];

const today = () => new Date().toISOString().slice(0, 10);
const round2 = (n: number) => Math.round(n * 100) / 100;

function errorAt(errors: unknown, path: string): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return path.split(".").reduce<any>((e, k) => e?.[k], errors)?.message;
}

export function NewBatchWizard({
  categories,
  farmers,
  partners,
}: {
  categories: CategorySummary[];
  farmers: AdminFarmer[];
  partners: AdminPartner[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const form = useForm<Values>({
    resolver: zodResolver(BatchCreateSchema) as never,
    shouldUnregister: true, // fields for the other crop or sales model drop out of the values
    defaultValues: {
      categoryId: "",
      salesModel: "FARMER_OWNED",
      harvestDate: "",
      packedDate: today(),
      attributes: { age: "new", sizeGrade: "medium" },
      quality: { grade: "A", pungency: "Medium" },
      products: [],
    },
  });
  const { register, control, handleSubmit, trigger, setValue, setError, getValues, formState } = form;
  const { errors, isSubmitting } = formState;
  const products = useFieldArray({ control, name: "products" });

  const [categoryId, salesModel, partnerId, inputKg, outputKg, purchasePrice, variety, watchedProducts] = useWatch({
    control,
    name: ["categoryId", "salesModel", "partnerId", "inputKg", "outputKg", "purchase.pricePerKg", "variety", "products"],
  });
  const category = categories.find((c) => c.id === categoryId);
  const crop = categoryId && isCategoryId(categoryId) ? CROPS[categoryId] : undefined;
  const partner = partners.find((p) => p.id === partnerId);
  const partnerChoices = useMemo(() => partners.filter((p) => !crop || p.type === crop.partnerType), [partners, crop]);
  const labels = partLabels(salesModel ?? "FARMER_OWNED");

  // Keep each pack's price equal to the sum of its parts (the API requires it).
  useEffect(() => {
    (watchedProducts ?? []).forEach((p: Product, i: number) => {
      const sum = sumParts(p.farmerShare, p.partnerShare, p.platformFee ?? 0);
      if (p.price !== sum) setValue(`products.${i}.price`, sum);
    });
  }, [watchedProducts, setValue]);

  /** Suggested parts for a pack size: platform fee from the category, the partner's fee, the farmer's purchase price. */
  const suggested = (bagSizeKg: number) => {
    const ratio = Number(inputKg) > 0 && Number(outputKg) > 0 ? Number(inputKg) / Number(outputKg) : 1;
    return {
      platformFee: round2((category?.platformFeePerKg ?? 0) * bagSizeKg),
      partnerShare: salesModel === "FARMER_OWNED" ? round2((partner?.processingFeePerKg ?? 0) * bagSizeKg) : 0,
      farmerShare: salesModel === "PARTNER_SOURCED" && Number(purchasePrice) > 0 ? Math.round(Number(purchasePrice) * ratio * bagSizeKg) : 0,
    };
  };

  const addPack = () => {
    const bag = category?.packSizesKg[0] ?? 1;
    const s = suggested(bag);
    products.append({ name: variety || "", bagSizeKg: bag, ...s, price: sumParts(s.farmerShare, s.partnerShare, s.platformFee), description: "", tags: [], featured: false });
  };

  const next = async () => {
    if (!(await trigger(STEP_FIELDS[step]))) return;
    if (step === 4 && products.fields.length === 0) addPack(); // start the packs step with one pack
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const onSubmit = async (values: Values) => {
    const result = await createBatch(values);
    if (!handleResult(result, setError)) {
      // Jump back to the first step with an error.
      const failed = (result.ok ? [] : result.issues ?? []).map((i) => i.path.split(".")[0]);
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

          {/* 1. Category */}
          <div hidden={step !== 0} className="grid gap-3 sm:grid-cols-2">
            {categories.map((c) => (
              <label key={c.id} className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 has-[:checked]:border-primary has-[:checked]:bg-secondary/50">
                <input type="radio" value={c.id} className="mt-1 accent-field" {...register("categoryId")} />
                <span>
                  <span className="font-display text-lg font-semibold">{c.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    Packs {c.packSizesKg.join(", ")} kg · platform fee {rupees(c.platformFeePerKg)}/kg{c.perishable ? " · perishable" : ""}
                  </span>
                </span>
              </label>
            ))}
            {e("categoryId") && <p className="text-sm text-destructive">Choose a category.</p>}
          </div>

          {/* 2. Sales model */}
          <div hidden={step !== 1} className="grid gap-3 sm:grid-cols-2">
            {(["FARMER_OWNED", "PARTNER_SOURCED"] as const).map((m) => (
              <label key={m} className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 has-[:checked]:border-primary has-[:checked]:bg-secondary/50">
                <input type="radio" value={m} className="mt-1 accent-field" {...register("salesModel")} />
                <span>
                  <span className="font-display text-lg font-semibold">{MODEL_LABEL[m]}</span>
                  <span className="block text-sm text-muted-foreground">
                    {m === "FARMER_OWNED"
                      ? "The farmer owns the produce and pays the partner a processing fee."
                      : "The partner buys from the farmer at a published price, then processes and sells."}
                  </span>
                </span>
              </label>
            ))}
          </div>

          {/* 3. Farmer and partner */}
          <div hidden={step !== 2} className="grid gap-4 sm:grid-cols-2">
            <Field id="farmerId" label="Farmer" error={e("farmerId")}>
              <Select {...register("farmerId")}>
                <option value="">Choose a farmer</option>
                {farmers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} · {f.village}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="partnerId" label={crop?.partnerType === "PACKHOUSE" ? "Packhouse" : "Mill"} error={e("partnerId")} hint={crop ? `Only ${crop.partnerType === "MILL" ? "rice mills" : "onion packhouses"} are listed.` : undefined}>
              <Select {...register("partnerId")}>
                <option value="">Choose a partner</option>
                {partnerChoices.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {rupees(p.processingFeePerKg)}/kg
                  </option>
                ))}
              </Select>
            </Field>
          </div>

          {/* 4. Variety, dates and kg */}
          <div hidden={step !== 3} className="grid gap-4 sm:grid-cols-2">
            <Field id="variety" label="Variety" error={e("variety")}>
              <Select {...register("variety")}>
                <option value="">Choose a variety</option>
                {(crop?.varieties ?? []).map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="hidden sm:block" />
            <Field id="harvestDate" label="Harvest date" error={e("harvestDate")}>
              <Input type="date" {...register("harvestDate")} />
            </Field>
            <Field id="packedDate" label="Packed date" error={e("packedDate")} hint="The batch id uses this date.">
              <Input type="date" {...register("packedDate")} />
            </Field>
            <Field id="inputKg" label={`Raw ${categoryId === "rice" ? "paddy" : "produce"} in (kg)`} error={e("inputKg")}>
              <Input type="number" step="1" min="1" {...register("inputKg", { valueAsNumber: true })} />
            </Field>
            <Field id="outputKg" label="Sellable out (kg)" error={e("outputKg")} hint="Becomes the batch's stock.">
              <Input type="number" step="1" min="1" {...register("outputKg", { valueAsNumber: true })} />
            </Field>
            {salesModel === "PARTNER_SOURCED" && (
              <>
                <Field id="purchase.date" label="Bought from the farmer on" error={e("purchase.date") ?? e("purchase")}>
                  <Input type="date" {...register("purchase.date")} />
                </Field>
                <Field id="purchase.pricePerKg" label="Price paid to the farmer (₹ per raw kg)" error={e("purchase.pricePerKg")}>
                  <Input type="number" step="0.01" min="0" {...register("purchase.pricePerKg", { valueAsNumber: true })} />
                </Field>
              </>
            )}
            {crop?.needsShelfLife && (
              <Field id="shelfLifeDays" label="Shelf life (days)" error={e("shelfLifeDays")} hint="Stops selling this many days after packing.">
                <Input type="number" step="1" min="1" {...register("shelfLifeDays", { valueAsNumber: true })} />
              </Field>
            )}
          </div>

          {/* 5. Crop details */}
          <div hidden={step !== 4}>{categoryId && <CropFields key={categoryId} categoryId={categoryId} register={register} errors={errors} />}</div>

          {/* 6. Packs and prices */}
          <div hidden={step !== 5} className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Prices are per pack. The customer price is always {labels.farmer.toLowerCase()} + {labels.partner.toLowerCase()} + platform fee.
            </p>
            {products.fields.map((field, i) => {
              const p = (watchedProducts?.[i] ?? field) as Product;
              const bagRegister = register(`products.${i}.bagSizeKg`, { valueAsNumber: true });
              return (
                <div key={field.id} className="rounded-lg border p-4" data-testid={`pack-${i}`}>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-display text-lg font-semibold">Pack {i + 1}</h3>
                    <Button type="button" variant="ghost" size="sm" onClick={() => products.remove(i)} aria-label={`Remove pack ${i + 1}`}>
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                  <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field id={`products.${i}.name`} label="Product name" error={e(`products.${i}.name`)}>
                        <Input {...register(`products.${i}.name`)} />
                      </Field>
                      <Field id={`products.${i}.bagSizeKg`} label="Pack size" error={e(`products.${i}.bagSizeKg`)}>
                        <Select
                          {...bagRegister}
                          onChange={(ev) => {
                            bagRegister.onChange(ev);
                            const s = suggested(Number(ev.target.value));
                            setValue(`products.${i}.platformFee`, s.platformFee);
                            if (salesModel === "FARMER_OWNED") setValue(`products.${i}.partnerShare`, s.partnerShare);
                            else if (s.farmerShare) setValue(`products.${i}.farmerShare`, s.farmerShare);
                          }}
                        >
                          {(category?.packSizesKg ?? []).map((kg) => (
                            <option key={kg} value={kg}>
                              {kg} kg
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field id={`products.${i}.farmerShare`} label={`${labels.farmer} (₹)`} error={e(`products.${i}.farmerShare`)}>
                        <Input type="number" step="0.01" min="0" {...register(`products.${i}.farmerShare`, { valueAsNumber: true })} />
                      </Field>
                      <Field id={`products.${i}.partnerShare`} label={`${labels.partner} (₹)`} error={e(`products.${i}.partnerShare`)}>
                        <Input type="number" step="0.01" min="0" {...register(`products.${i}.partnerShare`, { valueAsNumber: true })} />
                      </Field>
                      <Field id={`products.${i}.platformFee`} label="Platform fee (₹)" error={e(`products.${i}.platformFee`)} hint={category ? `${rupees(category.platformFeePerKg)}/kg by default` : undefined}>
                        <Input type="number" step="0.01" min="0" {...register(`products.${i}.platformFee`, { valueAsNumber: true })} />
                      </Field>
                      <input type="hidden" {...register(`products.${i}.price`, { valueAsNumber: true })} />
                      <Field id={`products.${i}.description`} label="Description" error={e(`products.${i}.description`) ?? e(`products.${i}.price`)} className="sm:col-span-2">
                        <Textarea rows={2} {...register(`products.${i}.description`)} />
                      </Field>
                    </div>
                    <PricePreview model={salesModel ?? "FARMER_OWNED"} farmerShare={p.farmerShare} partnerShare={p.partnerShare} platformFee={p.platformFee ?? 0} />
                  </div>
                </div>
              );
            })}
            <Button type="button" variant="outline" onClick={addPack} disabled={!category || products.fields.length >= 10}>
              <Plus aria-hidden="true" />
              Add a pack
            </Button>
          </div>

          {/* 7. Review */}
          {step === 6 && <Review values={getValues()} farmers={farmers} partners={partners} />}
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

function Review({ values, farmers, partners }: { values: Values; farmers: AdminFarmer[]; partners: AdminPartner[] }) {
  const farmer = farmers.find((f) => f.id === values.farmerId);
  const partner = partners.find((p) => p.id === values.partnerId);
  const rows: [string, string][] = [
    ["Crop", `${CATEGORY_LABEL[values.categoryId] ?? values.categoryId} · ${values.variety}`],
    ["Sales model", MODEL_LABEL[values.salesModel]],
    ["Farmer", farmer?.name ?? "–"],
    ["Partner", partner?.name ?? "–"],
    ["Harvested / packed", `${values.harvestDate} / ${values.packedDate}`],
    ["In / out", `${values.inputKg} kg / ${values.outputKg} kg (stock starts at ${values.outputKg} kg)`],
  ];
  if (values.purchase) rows.push(["Purchase", `${rupees(values.purchase.pricePerKg)}/kg on ${values.purchase.date}`]);
  if (values.shelfLifeDays) rows.push(["Shelf life", `${values.shelfLifeDays} days`]);
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
                <span className="font-semibold">{rupees(p.price)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-sm text-muted-foreground">The batch id (KS-YYYY-MMDD-XX) is generated when you create it.</p>
    </div>
  );
}
