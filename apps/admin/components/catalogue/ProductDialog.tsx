"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { type AdminProduct, type CategorySummary, ProductInputSchema } from "@kisa/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, Select, Textarea } from "@/components/ui/form-controls";
import { Input } from "@/components/ui/input";
import { addProduct, updateProduct } from "@/lib/actions";
import { handleResult } from "@/lib/form-errors";
import { rupees } from "@/lib/format";
import { PricePreview, partLabels, sumParts } from "./bits";

type Values = z.input<typeof ProductInputSchema>;

/** Add a pack to a batch, or edit one (pack size is fixed once created). ADMIN only. */
export function ProductDialog({
  batchId,
  model,
  category,
  product,
  defaultName,
  suggestPartnerShare,
}: {
  batchId: string;
  model: "FARMER_OWNED" | "PARTNER_SOURCED";
  category: CategorySummary;
  product?: AdminProduct;
  defaultName?: string;
  /** ₹ per kg suggested for the partner part (processing fee for farmer-owned batches). */
  suggestPartnerShare?: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const labels = partLabels(model);
  const defaults = (): Values => {
    if (product) {
      const { name, bagSizeKg, farmerShare, partnerShare, platformFee, price, description, tags, featured } = product;
      return { name, bagSizeKg, farmerShare, partnerShare, platformFee, price, description, tags, featured };
    }
    const bag = category.packSizesKg[0];
    const platformFee = Math.round(category.platformFeePerKg * bag * 100) / 100;
    const partnerShare = Math.round((suggestPartnerShare ?? 0) * bag * 100) / 100;
    return { name: defaultName ?? "", bagSizeKg: bag, farmerShare: 0, partnerShare, platformFee, price: partnerShare + platformFee, description: "", tags: [], featured: false };
  };
  const form = useForm<Values, unknown, z.output<typeof ProductInputSchema>>({ resolver: zodResolver(ProductInputSchema), defaultValues: defaults() });
  const { register, handleSubmit, setValue, setError, reset, control, formState } = form;
  const [farmerShare, partnerShare, platformFee, price] = useWatch({ control, name: ["farmerShare", "partnerShare", "platformFee", "price"] });

  useEffect(() => {
    const sum = sumParts(farmerShare, partnerShare, platformFee ?? 0);
    if (price !== sum) setValue("price", sum);
  }, [farmerShare, partnerShare, platformFee, price, setValue]);

  const onSubmit = async (v: z.output<typeof ProductInputSchema>) => {
    const result = product
      ? await updateProduct(product.id, { name: v.name, farmerShare: v.farmerShare, partnerShare: v.partnerShare, platformFee: v.platformFee, price: v.price, description: v.description, featured: v.featured })
      : await addProduct(batchId, v);
    if (!handleResult(result, setError)) return;
    toast.success(product ? "Pack updated" : `Added ${result.data.name}`);
    setOpen(false);
    router.refresh();
  };

  const errors = formState.errors;
  const bagRegister = register("bagSizeKg", { valueAsNumber: true });
  return (
    <Dialog open={open} onOpenChange={(o) => {
        setOpen(o);
        if (o) reset(defaults());
      }}>
      <DialogTrigger asChild>
        {product ? (
          <Button variant="ghost" size="sm" aria-label={`Edit ${product.name}`}>
            <Pencil aria-hidden="true" />
          </Button>
        ) : (
          <Button variant="outline" size="sm">
            <Plus aria-hidden="true" />
            Add a pack
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogTitle>{product ? `Edit ${product.name}` : "Add a pack"}</DialogTitle>
        <DialogDescription>Prices are per pack. The customer price is the sum of the three parts.</DialogDescription>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="name" label="Product name" error={errors.name?.message}>
              <Input {...register("name")} />
            </Field>
            <Field id="bagSizeKg" label="Pack size" error={errors.bagSizeKg?.message} hint={product ? "Fixed once created." : undefined}>
              {product ? (
                // Shown disabled; the value is sent from the hidden input below.
                <Select value={product.bagSizeKg} disabled onChange={() => undefined}>
                  <option value={product.bagSizeKg}>{product.bagSizeKg} kg</option>
                </Select>
              ) : (
              <Select
                {...bagRegister}
                onChange={(ev) => {
                  bagRegister.onChange(ev);
                  const kg = Number(ev.target.value);
                  setValue("platformFee", Math.round(category.platformFeePerKg * kg * 100) / 100);
                  if (suggestPartnerShare) setValue("partnerShare", Math.round(suggestPartnerShare * kg * 100) / 100);
                }}
              >
                {category.packSizesKg.map((kg) => (
                  <option key={kg} value={kg}>
                    {kg} kg
                  </option>
                ))}
              </Select>
              )}
            </Field>
            <Field id="farmerShare" label={`${labels.farmer} (₹)`} error={errors.farmerShare?.message}>
              <Input type="number" step="0.01" min="0" {...register("farmerShare", { valueAsNumber: true })} />
            </Field>
            <Field id="partnerShare" label={`${labels.partner} (₹)`} error={errors.partnerShare?.message}>
              <Input type="number" step="0.01" min="0" {...register("partnerShare", { valueAsNumber: true })} />
            </Field>
            <Field id="platformFee" label="Platform fee (₹)" error={errors.platformFee?.message} hint={`${rupees(category.platformFeePerKg)}/kg by default`}>
              <Input type="number" step="0.01" min="0" {...register("platformFee", { valueAsNumber: true })} />
            </Field>
            <label className="flex items-center gap-2 self-end pb-2 text-sm font-semibold">
              <input type="checkbox" className="size-4 accent-field" {...register("featured")} />
              Feature on the home page
            </label>
            <Field id="description" label="Description" error={errors.description?.message ?? errors.price?.message} className="sm:col-span-2">
              <Textarea rows={2} {...register("description")} />
            </Field>
          </div>
          <input type="hidden" {...register("price", { valueAsNumber: true })} />
          {product && <input type="hidden" {...bagRegister} />}
          <PricePreview model={model} farmerShare={farmerShare} partnerShare={partnerShare} platformFee={platformFee ?? 0} />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting && <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />}
              {product ? "Save pack" : "Add pack"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
