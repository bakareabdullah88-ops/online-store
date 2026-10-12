export type ServiceErrorCode =
  | "NOT_FOUND"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION"
  | "CONFLICT"
  | "NOT_IMPLEMENTED"
  | "UNAVAILABLE";

/** Typed error thrown by every service. Maps 1:1 to HTTP status codes in API_CONTRACT.md. */
export class ServiceError extends Error {
  readonly code: ServiceErrorCode;
  readonly fields?: Record<string, string>;

  constructor(code: ServiceErrorCode, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
    if (fields) this.fields = fields;
  }
}

export function isServiceError(e: unknown): e is ServiceError {
  return e instanceof ServiceError || (typeof e === "object" && e !== null && (e as { name?: string }).name === "ServiceError");
}

/** Human message for any thrown value. */
export function errorMessage(e: unknown, fallback = "Something went wrong. Please try again."): string {
  if (isServiceError(e)) return e.message;
  if (e instanceof Error && e.message) return e.message;
  return fallback;
}
