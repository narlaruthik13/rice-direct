"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Field, Select } from "@/components/ui/form-controls";
import { Input } from "@/components/ui/input";

// The crop-specific part of a batch: attributes and the quality report. Field names
// match the shared zod schemas (RiceAttributesSchema, OnionQualitySchema, ...).

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyForm = any;

const num = { valueAsNumber: true };

function errorAt(errors: FieldErrors<AnyForm>, path: string): string | undefined {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const node = path.split(".").reduce<any>((e, k) => e?.[k], errors);
  return node?.message as string | undefined;
}

export function CropFields({
  categoryId,
  register,
  errors,
}: {
  categoryId: string;
  register: UseFormRegister<AnyForm>;
  errors: FieldErrors<AnyForm>;
}) {
  const e = (p: string) => errorAt(errors, p);
  const lab = (
    <>
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
    </>
  );

  if (categoryId === "rice") {
    return (
      <div className="space-y-6">
        <section>
          <h3 className="mb-3 font-display text-lg font-semibold">Milling</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="attributes.millingDate" label="Milling date" error={e("attributes.millingDate")}>
              <Input type="date" {...register("attributes.millingDate")} />
            </Field>
            <Field id="attributes.age" label="Age" error={e("attributes.age")} hint="Aged = stored 6+ months; cooks fluffier.">
              <Select {...register("attributes.age")}>
                <option value="new">New crop</option>
                <option value="aged">Aged</option>
              </Select>
            </Field>
          </div>
        </section>
        <section>
          <h3 className="mb-3 font-display text-lg font-semibold">Quality report</h3>
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
            {lab}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section>
        <h3 className="mb-3 font-display text-lg font-semibold">Curing and grading</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="attributes.curingDays" label="Curing days" error={e("attributes.curingDays")}>
            <Input type="number" step="1" {...register("attributes.curingDays", num)} />
          </Field>
          <Field id="attributes.gradingDate" label="Grading date" error={e("attributes.gradingDate")}>
            <Input type="date" {...register("attributes.gradingDate")} />
          </Field>
          <Field id="attributes.sizeGrade" label="Size grade" error={e("attributes.sizeGrade")}>
            <Select {...register("attributes.sizeGrade")}>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </Select>
          </Field>
        </div>
      </section>
      <section>
        <h3 className="mb-3 font-display text-lg font-semibold">Quality report</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field id="quality.avgSizeMm" label="Average size (mm)" error={e("quality.avgSizeMm")}>
            <Input type="number" step="1" {...register("quality.avgSizeMm", num)} />
          </Field>
          <Field id="quality.damagedPct" label="Damaged %" error={e("quality.damagedPct")}>
            <Input type="number" step="0.1" {...register("quality.damagedPct", num)} />
          </Field>
          <Field id="quality.sproutedPct" label="Sprouted %" error={e("quality.sproutedPct")}>
            <Input type="number" step="0.1" {...register("quality.sproutedPct", num)} />
          </Field>
          <Field id="quality.skin" label="Skin" error={e("quality.skin")}>
            <Input placeholder="Dry, tight, deep red" {...register("quality.skin")} />
          </Field>
          <Field id="quality.pungency" label="Pungency" error={e("quality.pungency")}>
            <Select {...register("quality.pungency")}>
              <option value="Mild">Mild</option>
              <option value="Medium">Medium</option>
              <option value="Strong">Strong</option>
            </Select>
          </Field>
          {lab}
        </div>
      </section>
    </div>
  );
}

/** Default crop values for a new batch form. */
export const cropDefaults = (categoryId: string) =>
  categoryId === "rice"
    ? { attributes: { age: "new" }, quality: { grade: "A" } }
    : { attributes: { sizeGrade: "medium" }, quality: { grade: "A", pungency: "Medium" } };
