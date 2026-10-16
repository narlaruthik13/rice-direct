"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Field, Select } from "@/components/ui/form-controls";
import { Input } from "@/components/ui/input";

// The rice quality report (Batch.quality), shown on the Quality Passport. Field names
// match RiceQualitySchema in @kisa/shared, so API errors land on the right field.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyForm = any;

const num = { valueAsNumber: true };

function errorAt(errors: FieldErrors<AnyForm>, path: string): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return path.split(".").reduce<any>((e, k) => e?.[k], errors)?.message;
}

export function QualityFields({ register, errors }: { register: UseFormRegister<AnyForm>; errors: FieldErrors<AnyForm> }) {
  const e = (p: string) => errorAt(errors, p);
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Field id="quality.moisturePct" label="Moisture %" error={e("quality.moisturePct")}>
        <Input type="number" step="0.1" {...register("quality.moisturePct", num)} />
      </Field>
      <Field id="quality.brokenPct" label="Broken grains %" error={e("quality.brokenPct")}>
        <Input type="number" step="0.1" {...register("quality.brokenPct", num)} />
      </Field>
      <Field id="quality.foreignMatterPct" label="Foreign matter %" error={e("quality.foreignMatterPct")}>
        <Input type="number" step="0.01" {...register("quality.foreignMatterPct", num)} />
      </Field>
      <Field id="quality.grainLengthMm" label="Grain length (mm)" error={e("quality.grainLengthMm")}>
        <Input type="number" step="0.1" {...register("quality.grainLengthMm", num)} />
      </Field>
      <Field id="quality.testedBy" label="Tested by" error={e("quality.testedBy")}>
        <Input {...register("quality.testedBy")} />
      </Field>
      <Field id="quality.testedOn" label="Tested on" error={e("quality.testedOn")}>
        <Input type="date" {...register("quality.testedOn")} />
      </Field>
      <Field id="quality.grade" label="Grade" error={e("quality.grade")}>
        <Select {...register("quality.grade")}>
          <option value="A">A</option>
          <option value="A+">A+</option>
          <option value="Premium">Premium</option>
        </Select>
      </Field>
    </div>
  );
}
