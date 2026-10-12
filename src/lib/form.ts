import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { errorMessage, isServiceError } from "@/services/errors";
import { toast } from "@/stores/toast";

/** Maps ServiceError field messages onto the form; falls back to a toast. */
export function applyServiceErrors<T extends FieldValues>(
  e: unknown,
  setError: UseFormSetError<T>,
  known: Path<T>[],
) {
  if (isServiceError(e) && e.fields) {
    let mapped = false;
    for (const [k, msg] of Object.entries(e.fields)) {
      if ((known as string[]).includes(k)) {
        setError(k as Path<T>, { message: msg }, { shouldFocus: !mapped });
        mapped = true;
      }
    }
    if (mapped) return;
  }
  toast.error(errorMessage(e));
}
