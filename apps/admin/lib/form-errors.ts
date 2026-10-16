import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "sonner";
import type { ActionResult } from "./actions";

/**
 * Shows a failed action on the form: field issues from the API go under their fields,
 * and the message appears as a toast. Returns true when the action succeeded.
 */
export function handleResult<T, F extends FieldValues>(result: ActionResult<T>, setError?: UseFormSetError<F>): result is { ok: true; data: T } {
  if (result.ok) return true;
  if (setError) {
    for (const issue of result.issues ?? []) setError(issue.path as Path<F>, { type: "server", message: issue.message });
  }
  const first = result.issues?.[0];
  toast.error(result.status === 400 && first ? `Please fix: ${first.message}` : result.message);
  return false;
}
