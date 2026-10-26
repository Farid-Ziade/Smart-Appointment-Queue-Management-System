import { DateTime } from "luxon";
import type { ReadRepository } from "../business/ReadRepository.js";
import type { Actor } from "../../booking/use-cases/BookingService.js";
import { day, record, text } from "../../../shared/validation/input.js";
import { AppError } from "../../../shared/errors/AppError.js";
export function createReadService(
  repository: ReadRepository,
  zone: string,
  clock = () => new Date(),
) {
  function range(input: unknown, dashboard = false) {
    const data = record(input),
      today = DateTime.fromJSDate(clock(), { zone }).startOf("day");
    const from = data.from
      ? DateTime.fromISO(day(data.from), { zone })
      : dashboard
        ? today
        : today.minus({ days: 30 });
    const last = data.to
      ? DateTime.fromISO(day(data.to), { zone })
      : dashboard
        ? today
        : today.plus({ days: 90 });
    if (last < from || last.diff(from, "days").days > 365)
      throw new AppError(
        "INVALID_INPUT",
        "Choose an ordered date range of at most 366 days.",
      );
    return { from, last, to: last.plus({ days: 1 }) };
  }
  return {
    appointments(actor: Actor, input: unknown) {
      const data = record(input),
        { from, to } = range(data),
        page = Number(data.page ?? 1);
      if (!Number.isSafeInteger(page) || page < 1 || page > 100000)
        throw new AppError("INVALID_INPUT", "Invalid page.");
      return repository.appointments(
        actor,
        from.toJSDate(),
        to.toJSDate(),
        data.search ? text(data.search, "Search", 100) : "",
        page,
      );
    },
    queue(actor: Actor) {
      if (actor.role === "customer")
        throw new AppError("FORBIDDEN", "Staff access is required.");
      return repository.queue(
        actor,
        DateTime.fromJSDate(clock(), { zone }).toISODate()!,
      );
    },
    dashboard(actor: Actor, input: unknown) {
      if (actor.role !== "admin")
        throw new AppError("FORBIDDEN", "Administrator access is required.");
      const { from, last, to } = range(input, true);
      return repository.dashboard(
        from.toJSDate(),
        to.toJSDate(),
        DateTime.fromJSDate(clock(), { zone }).toISODate()!,
        last.minus({ days: 6 }).toJSDate(),
        zone,
      );
    },
  };
}
