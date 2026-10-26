import { DateTime } from "luxon";
import { AppError } from "../errors/AppError.js";
export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new AppError("INVALID_INPUT", "Send a JSON object.");
  return value as Record<string, unknown>;
}
export function text(value: unknown, name: string, max = 200): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    throw new AppError(
      "INVALID_INPUT",
      `${name} is required and must be at most ${max} characters.`,
    );
  return value.trim();
}
export function id(value: unknown, name = "ID") {
  const result = text(value, name, 24);
  if (!/^[a-f\d]{24}$/i.test(result))
    throw new AppError("INVALID_INPUT", `${name} is invalid.`);
  return result.toLowerCase();
}
export function integer(
  value: unknown,
  name: string,
  min: number,
  max: number,
) {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < min ||
    value > max
  )
    throw new AppError(
      "INVALID_INPUT",
      `${name} must be a whole number between ${min} and ${max}.`,
    );
  return value;
}
export function bool(value: unknown, name: string) {
  if (typeof value !== "boolean")
    throw new AppError("INVALID_INPUT", `${name} must be true or false.`);
  return value;
}
export function day(value: unknown) {
  const result = text(value, "Date", 10);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(result) ||
    !DateTime.fromISO(result, { zone: "UTC" }).isValid
  )
    throw new AppError("INVALID_INPUT", "Use a valid YYYY-MM-DD date.");
  return result;
}
export function instant(value: unknown) {
  const result = text(value, "Start time", 40);
  if (!/(Z|[+-]\d{2}:\d{2})$/.test(result))
    throw new AppError(
      "INVALID_INPUT",
      "Start time must include a timezone offset.",
    );
  const date = DateTime.fromISO(result, { setZone: true });
  if (!date.isValid || date.second || date.millisecond)
    throw new AppError("INVALID_INPUT", "Use a valid time with whole minutes.");
  return date.toJSDate();
}
