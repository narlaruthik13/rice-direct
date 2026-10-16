"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { type AdminVariety, VarietyInputSchema, VarietyUpdateSchema } from "@kisa/shared";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/form-controls";
import { Input } from "@/components/ui/input";
import { createVariety, renameVariety } from "@/lib/actions";
import { handleResult } from "@/lib/form-errors";

// Create: the shared VarietyInputSchema (category is rice for now). Rename: VarietyUpdateSchema
// with the name required. The slug is set at creation and never changes (website links use it).
const CreateSchema = VarietyInputSchema;
const RenameSchema = VarietyUpdateSchema.required();

export function VarietyDialog({ variety }: { variety?: AdminVariety }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const form = useForm<{ categoryId: string; name: string }>({
    resolver: zodResolver(variety ? RenameSchema.extend({ categoryId: z.string() }) : CreateSchema),
    defaultValues: { categoryId: variety?.categoryId ?? "rice", name: variety?.name ?? "" },
  });
  const { register, handleSubmit, setError, reset, formState } = form;

  const onSubmit = async (v: { categoryId: string; name: string }) => {
    const result = variety ? await renameVariety(variety.id, v.name) : await createVariety({ categoryId: v.categoryId, name: v.name });
    if (!handleResult(result, setError)) {
      if (!result.ok && result.status === 409) setError("name", { message: result.message });
      return;
    }
    toast.success(variety ? `Renamed to ${result.data.name}` : `Added ${result.data.name}`);
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) reset({ categoryId: variety?.categoryId ?? "rice", name: variety?.name ?? "" });
      }}
    >
      <DialogTrigger asChild>
        {variety ? (
          <Button variant="ghost" size="sm" aria-label={`Rename ${variety.name}`}>
            <Pencil aria-hidden="true" />
          </Button>
        ) : (
          <Button>
            <Plus aria-hidden="true" />
            New variety
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{variety ? `Rename ${variety.name}` : "New variety"}</DialogTitle>
        <DialogDescription>
          {variety ? `The link name stays “${variety.slug}”, so existing website links keep working.` : "A rice variety you sell, e.g. Sona Masoori or HMT."}
        </DialogDescription>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-4 space-y-4">
          <input type="hidden" {...register("categoryId")} />
          <Field id="variety-name" label="Variety name" error={formState.errors.name?.message}>
            <Input autoFocus {...register("name")} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={formState.isSubmitting}>
              {formState.isSubmitting && <Loader2 className="motion-safe:animate-spin" aria-hidden="true" />}
              {variety ? "Save name" : "Add variety"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
