"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { z } from "zod";
import { type AdminFarmer, FarmerInputSchema } from "@kisa/shared";
import { Button } from "@/components/ui/button";
import { Field, Select, Textarea } from "@/components/ui/form-controls";
import { Input } from "@/components/ui/input";
import { createFarmer, updateFarmer } from "@/lib/actions";
import { handleResult } from "@/lib/form-errors";

type Values = z.input<typeof FarmerInputSchema>;

/** Create or edit a farmer. Read-only for STAFF. */
export function FarmerForm({ farmer, readOnly = false }: { farmer?: AdminFarmer; readOnly?: boolean }) {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Values, unknown, z.output<typeof FarmerInputSchema>>({
    resolver: zodResolver(FarmerInputSchema),
    defaultValues: farmer
      ? {
          name: farmer.name,
          phone: farmer.phone ?? "",
          village: farmer.village,
          district: farmer.district,
          state: farmer.state,
          acres: farmer.acres,
          yearsFarming: farmer.yearsFarming,
          method: farmer.method,
          story: farmer.story,
          photoUrl: farmer.photoUrl ?? "",
        }
      : { state: "Telangana", method: "conventional", phone: "", photoUrl: "" },
  });

  const onSubmit = async (values: z.output<typeof FarmerInputSchema>) => {
    const result = farmer ? await updateFarmer(farmer.id, values) : await createFarmer(values);
    if (!handleResult(result, setError)) return;
    toast.success(farmer ? "Farmer updated" : `Added ${result.data.name}`);
    if (farmer) router.refresh();
    else router.push(`/farmers/${result.data.id}`);
  };

  const err = (k: keyof Values) => errors[k]?.message as string | undefined;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <fieldset disabled={readOnly || isSubmitting} className="grid gap-4 sm:grid-cols-2">
        <Field id="name" label="Name" error={err("name")}>
          <Input {...register("name")} />
        </Field>
        <Field id="phone" label="Mobile number" error={err("phone")} hint="Optional. 10 digits.">
          <Input inputMode="numeric" {...register("phone")} />
        </Field>
        <Field id="village" label="Village" error={err("village")}>
          <Input {...register("village")} />
        </Field>
        <Field id="district" label="District" error={err("district")}>
          <Input {...register("district")} />
        </Field>
        <Field id="state" label="State" error={err("state")}>
          <Input {...register("state")} />
        </Field>
        <Field id="method" label="Farming method" error={err("method")}>
          <Select {...register("method")}>
            <option value="conventional">Conventional</option>
            <option value="low-chemical">Low-chemical</option>
            <option value="natural">Natural</option>
          </Select>
        </Field>
        <Field id="acres" label="Farm size (acres)" error={err("acres")}>
          <Input type="number" step="0.1" min="0" {...register("acres", { valueAsNumber: true })} />
        </Field>
        <Field id="yearsFarming" label="Years farming" error={err("yearsFarming")}>
          <Input type="number" step="1" min="0" {...register("yearsFarming", { valueAsNumber: true })} />
        </Field>
        <Field id="story" label="Story" error={err("story")} hint="Shown on product and trace pages." className="sm:col-span-2">
          <Textarea rows={4} {...register("story")} />
        </Field>
        <Field id="photoUrl" label="Photo URL" error={err("photoUrl")} hint="Optional." className="sm:col-span-2">
          <Input type="url" {...register("photoUrl")} />
        </Field>
      </fieldset>
      {!readOnly && (
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting || (!!farmer && !isDirty)}>
            {isSubmitting && <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />}
            {farmer ? "Save changes" : "Add farmer"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
            Cancel
          </Button>
        </div>
      )}
    </form>
  );
}
