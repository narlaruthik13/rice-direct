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
import { PricePreview, priceOf } from "./bits";

type Values = z.input<typeof ProductInputSchema>;

/** Add a pack to a batch, or edit one (pack size is fixed once created). ADMIN only. */
export function ProductDialog({ batchId, category, product, defaultName }: { batchId: string; category: CategorySummary; product?: AdminProduct; defaultName?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const defaults = (): Values => {
    if (product) {
      const { name, bagSizeKg, millPrice, kisaMargin, price, description, tags, featured } = product;
      return { name, bagSizeKg, millPrice, kisaMargin, price, description, tags, featured };
    }
    return { name: defaultName ?? "", bagSizeKg: category.packSizesKg[0], millPrice: 0, kisaMargin: 0, price: 0, description: "", tags: [], featured: false };
  };
  const form = useForm<Values, unknown, z.output<typeof ProductInputSchema>>({ resolver: zodResolver(ProductInputSchema), defaultValues: defaults() });
  const { register, handleSubmit, setValue, setError, reset, control, formState } = form;
  const [millPrice, kisaMargin, price] = useWatch({ control, name: ["millPrice", "kisaMargin", "price"] });

  // The API requires price = mill price + Kisa margin.
  useEffect(() => {
    const sum = priceOf(millPrice, kisaMargin);
    if (price !== sum) setValue("price", sum);
  }, [millPrice, kisaMargin, price, setValue]);

  const onSubmit = async (v: z.output<typeof ProductInputSchema>) => {
    const result = product
      ? await updateProduct(product.id, { name: v.name, millPrice: v.millPrice, kisaMargin: v.kisaMargin, price: v.price, description: v.description, featured: v.featured })
      : await addProduct(batchId, v);
    if (!handleResult(result, setError)) return;
    toast.success(product ? "Pack updated" : `Added ${result.data.name}`);
    setOpen(false);
    router.refresh();
  };

  const errors = formState.errors;
  const bagRegister = register("bagSizeKg", { valueAsNumber: true });
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) reset(defaults());
      }}
    >
      <DialogTrigger asChild>
        {product ? (
          <Button variant="ghost" size="sm" aria-label={`Edit ${product.name} ${product.bagSizeKg} kg`}>
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
        <DialogTitle>{product ? `Edit ${product.name}, ${product.bagSizeKg} kg` : "Add a pack"}</DialogTitle>
        <DialogDescription>Prices are per pack. Customers see only the total.</DialogDescription>
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
                <Select {...bagRegister}>
                  {category.packSizesKg.map((kg) => (
                    <option key={kg} value={kg}>
                      {kg} kg
                    </option>
                  ))}
                </Select>
              )}
            </Field>
            <Field id="millPrice" label="Mill price (₹ per pack)" error={errors.millPrice?.message}>
              <Input type="number" step="0.01" min="0" {...register("millPrice", { valueAsNumber: true })} />
            </Field>
            <Field id="kisaMargin" label="Kisa margin (₹ per pack)" error={errors.kisaMargin?.message}>
              <Input type="number" step="0.01" min="0" {...register("kisaMargin", { valueAsNumber: true })} />
            </Field>
            <Field id="description" label="Description" error={errors.description?.message ?? errors.price?.message} className="sm:col-span-2">
              <Textarea rows={2} {...register("description")} />
            </Field>
            <label className="flex items-center gap-2 text-sm font-semibold sm:col-span-2">
              <input type="checkbox" className="size-4 accent-field" {...register("featured")} />
              Feature on the home page
            </label>
          </div>
          <input type="hidden" {...register("price", { valueAsNumber: true })} />
          {product && <input type="hidden" {...bagRegister} />}
          <PricePreview millPrice={millPrice} kisaMargin={kisaMargin} />
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
