export type ErrorCode =
  | "INVALID_INPUT"
  | "EMAIL_IN_USE"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "SLOT_UNAVAILABLE"
  | "IDEMPOTENCY_CONFLICT";
export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
