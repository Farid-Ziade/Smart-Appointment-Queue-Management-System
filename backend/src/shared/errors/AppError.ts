export class AppError extends Error {
  constructor(
    public readonly code: "INVALID_INPUT" | "EMAIL_IN_USE",
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}
