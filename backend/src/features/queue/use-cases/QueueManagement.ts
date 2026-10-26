import { DateTime } from "luxon";
import type { UnitOfWork } from "../../../shared/ports/UnitOfWork.js";
import type { Actor } from "../../booking/use-cases/BookingService.js";
import { operator } from "../../booking/use-cases/BookingService.js";
import { AppError } from "../../../shared/errors/AppError.js";
import { id, integer, record, text } from "../../../shared/validation/input.js";
export function createQueueManagement(
  uow: UnitOfWork,
  zone: string,
  graceMinutes: number,
  clock = () => new Date(),
) {
  const today = () => DateTime.fromJSDate(clock(), { zone }).toISODate()!;
  return {
    async checkIn(actor: Actor, input: unknown) {
      const reference = text(
        record(input).reference,
        "Booking reference",
        40,
      ).toUpperCase();
      return uow.run(async (store) => {
        await store.lockQueue();
        const appointment = await store.appointments.byReference(reference);
        if (!appointment)
          throw new AppError("NOT_FOUND", "Appointment not found.");
        operator(actor, appointment.staffId);
        await store.schedules.lock(appointment.staffId);
        if (
          appointment.status !== "Confirmed" ||
          (await store.queue.byAppointment(appointment.id))
        )
          throw new AppError(
            "CONFLICT",
            "Only a confirmed appointment can be checked in once.",
          );
        if (
          DateTime.fromJSDate(appointment.startAt, { zone }).toISODate() !==
            today() ||
          clock().getTime() >
            appointment.startAt.getTime() + graceMinutes * 60000
        )
          throw new AppError(
            "CONFLICT",
            "Check-in is only available on the appointment day and within the grace period.",
          );
        const number = await store.queue.nextNumber(today());
        const entry = await store.queue.create({
          appointmentId: appointment.id,
          staffId: appointment.staffId,
          day: today(),
          number,
          priority: 0,
          status: "Waiting",
          checkedInAt: clock(),
        });
        await store.appointments.update(appointment.id, {
          status: "CheckedIn",
          revision: appointment.revision + 1,
        });
        return entry;
      });
    },
    async callNext(actor: Actor, input: unknown) {
      const staffId = id(record(input).staffId);
      operator(actor, staffId);
      return uow.run(async (store) => {
        await store.lockQueue();
        await store.schedules.lock(staffId);
        if (await store.queue.busy(today(), staffId))
          throw new AppError(
            "CONFLICT",
            "Finish the currently called customer before calling another.",
          );
        const entry = await store.queue.waiting(today(), staffId);
        if (!entry)
          throw new AppError(
            "NOT_FOUND",
            "No customers are waiting for this employee.",
          );
        return store.queue.update(entry.id, {
          status: "Called",
          calledAt: clock(),
        });
      });
    },
    async transition(
      actor: Actor,
      entryId: unknown,
      action: "start" | "complete",
    ) {
      return uow.run(async (store) => {
        await store.lockQueue();
        const entry = await store.queue.get(id(entryId));
        if (!entry) throw new AppError("NOT_FOUND", "Queue entry not found.");
        operator(actor, entry.staffId);
        await store.schedules.lock(entry.staffId);
        if (
          entry.day !== today() ||
          entry.status !== (action === "start" ? "Called" : "InService")
        )
          throw new AppError(
            "CONFLICT",
            "This queue action is no longer available.",
          );
        const appointment = await store.appointments.get(entry.appointmentId);
        if (
          !appointment ||
          appointment.status !==
            (action === "start" ? "CheckedIn" : "InService")
        )
          throw new AppError("CONFLICT", "The appointment status has changed.");
        const status = action === "start" ? "InService" : "Completed";
        const entryChanges =
          action === "start"
            ? { status, startedAt: clock() }
            : { status, completedAt: clock() };
        const updated = await store.queue.update(entry.id, {
          ...entryChanges,
          status,
        });
        await store.appointments.update(appointment.id, {
          status,
          revision: appointment.revision + 1,
          ...(action === "complete" ? { completedAt: clock() } : {}),
        });
        return updated;
      });
    },
    async prioritize(actor: Actor, entryId: unknown, input: unknown) {
      if (actor.role !== "admin")
        throw new AppError(
          "FORBIDDEN",
          "Only an administrator can change queue priority.",
        );
      const priority = integer(record(input).priority, "Priority", 0, 1000);
      return uow.run(async (store) => {
        await store.lockQueue();
        const entry = await store.queue.get(id(entryId));
        if (!entry || entry.day !== today() || entry.status !== "Waiting")
          throw new AppError(
            "CONFLICT",
            "Only today’s waiting entries can change priority.",
          );
        return store.queue.update(entry.id, { priority });
      });
    },
  };
}
