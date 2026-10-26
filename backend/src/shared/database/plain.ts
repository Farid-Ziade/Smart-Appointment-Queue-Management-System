import { Types } from "mongoose";
export function plain<T>(document: unknown): T {
  function convert(value: unknown): unknown {
    if (value instanceof Date) return value;
    if (value instanceof Types.ObjectId) return value.toString();
    if (Array.isArray(value)) return value.map(convert);
    if (value && typeof value === "object") {
      if ("toObject" in value && typeof value.toObject === "function")
        return convert(value.toObject());
      return Object.fromEntries(
        Object.entries(value)
          .filter(([key]) => key !== "__v")
          .map(([key, item]) => [key === "_id" ? "id" : key, convert(item)]),
      );
    }
    return value;
  }
  return convert(document) as T;
}
