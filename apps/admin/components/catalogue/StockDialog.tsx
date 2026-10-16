"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { Loader2, Scale } from "lucide-react";
import { toast } from "sonner";
import { StockAdjustmentSchema } from "@kisa/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field, Select, Textarea } from "@/components/ui/form-controls";
import { Input } from "@/components/ui/input";
import { adjustStock } from "@/lib/actions";
import { handleResult } from "@/lib/form-errors";

interface Values {
  direction: "remove" | "add";
  kg: number;
  reason: "DAMAGED" | "RECOUNT" | "RETURNED" | "OTHER" | "";
  note: string;
}

/** Manual stock correction with a required reason. ADMIN and STAFF. */
export function StockDialog({ batchId, availableKg, outputKg }: { batchId: string; availableKg: number; outputKg: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { register, handleSubmit, reset, setError, control, formState } = useForm<Values>({
    defaultValues: { direction: "remove", reason: "", note: "" },
  });
  const [direction, kg] = useWatch({ control, name: ["direction", "kg"] });
  const after = availableKg + (direction === "remove" ? -1 : 1) * (Number(kg) || 0);

  const onSubmit = async (v: Values) => {
    const input = { deltaKg: (v.direction === "remove" ? -1 : 1) * v.kg, reason: v.reason || undefined, note: v.note || undefined };
    const parsed = StockAdjustmentSchema.safeParse(input);
    if (!parsed.success) {
      for (const i of parsed.error.issues) {
        const field = i.path[0] === "deltaKg" ? "kg" : (i.path[0] as keyof Values);
        setError(field, { message: i.message });
      }
      return;
    }
    const result = await adjustStock(batchId, parsed.data);
    if (!handleResult(result)) return;
    toast.success(`Stock is now ${result.data.availableKg} kg`);
    setOpen(false);
    reset();
    router.refresh();
  };

  const errors = formState.errors;
  return (
    <Dialog open={open} onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Scale aria-hidden="true" />
          Adjust stock
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Adjust stock</DialogTitle>
        <DialogDescription>
          Now {availableKg} kg of {outputKg} kg. Orders reduce stock on their own; use this for damage, recounts and returns.
        </DialogDescription>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field id="direction" label="Change">
              <Select {...register("direction")}>
                <option value="remove">Remove stock</option>
                <option value="add">Add stock</option>
              </Select>
            </Field>
            <Field id="kg" label="Kilograms" error={errors.kg?.message}>
              <Input type="number" min="1" step="1" {...register("kg", { valueAsNumber: true })} />
            </Field>
          </div>
          <Field id="reason" label="Reason" error={errors.reason?.message}>
            <Select {...register("reason")}>
              <option value="">Choose a reason</option>
              <option value="DAMAGED">Damaged</option>
              <option value="RECOUNT">Recount</option>
              <option value="RETURNED">Returned</option>
              <option value="OTHER">Other</option>
            </Select>
          </Field>
          <Field id="note" label="Note" error={errors.note?.message} hint="Required for “Other”.">
            <Textarea rows={2} {...register("note")} />
          </Field>
          <p className={after < 0 || after > outputKg ? "text-sm font-semibold text-destructive" : "text-sm text-muted-foreground"}>
            Stock after: {after} kg {after < 0 ? "(can't go below 0)" : after > outputKg ? `(can't exceed ${outputKg} kg)` : ""}
          </p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting && <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />}
              Save adjustment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
