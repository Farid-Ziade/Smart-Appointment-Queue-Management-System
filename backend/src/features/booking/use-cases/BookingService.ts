import { createHash, randomUUID } from "node:crypto";
import { DateTime } from "luxon";
import type { UnitOfWork, Store } from "../../../shared/ports/UnitOfWork.js";
import type { UserRole } from "../../users/business/User.js";
import type { Appointment } from "../business/Appointment.js";
import {
  assertBookingTime,
  fitsSchedule,
  overlaps,
} from "../business/BookingPolicy.js";
import { AppError } from "../../../shared/errors/AppError.js";
import {
  day,
  id,
  instant,
  record,
  text,
} from "../../../shared/validation/input.js";
export interface Actor {
  id: string;
  role: UserRole;
}
export function authorizeAppointment(actor: Actor, appointment: Appointment) {
  if (actor.role === "customer" && appointment.customerId !== actor.id)
    throw new AppError(
      "FORBIDDEN",
      "You can only access your own appointments.",
    );
  if (actor.role === "staff" && appointment.staffId !== actor.id)
    throw new AppError(
      "FORBIDDEN",
      "This appointment is assigned to another employee.",
    );
}
export function operator(actor: Actor, staffId: string) {
  if (
    actor.role !== "admin" &&
    (actor.role !== "staff" || actor.id !== staffId)
  )
    throw new AppError(
      "FORBIDDEN",
      "You cannot manage this employee’s appointments.",
    );
}
function found<T>(value: T | null, label: string): T {
  if (!value) throw new AppError("NOT_FOUND", `${label} not found.`);
  return value;
}
export function createBookingService(
  uow: UnitOfWork,
  options: {
    zone: string;
    slotMinutes: number;
    graceMinutes: number;
    currency: string;
  },
  clock = () => new Date(),
) {
  const { zone, slotMinutes, graceMinutes, currency } = options;
  async function notify(
    store: Store,
    appointment: Appointment,
    action: string,
  ) {
    const customer = found(
      await store.users.findById(appointment.customerId),
      "Customer",
    );
    const when = DateTime.fromJSDate(appointment.startAt, { zone }).toFormat(
      "ccc dd LLL yyyy HH:mm ZZZZ",
    );
    await store.outbox.add({
      key: `${appointment.id}:${appointment.revision}:${action}`,
      to: customer.email,
      subject: `Appointment ${action}: ${appointment.reference}`,
      text: `Hello ${customer.fullName},\nYour appointment ${appointment.reference} is ${action}.\nService: ${appointment.serviceName}\nTime: ${when} (${zone})\nDuration: ${appointment.durationMinutes} minutes\nPrice: ${(appointment.priceCents / 100).toFixed(2)} ${currency}\nStatus: ${appointment.status}`,
    });
  }
  return {
    async availability(actor: Actor, input: unknown) {
      const data = record(input),
        serviceId = id(data.serviceId),
        staffId = id(data.staffId),
        date = day(data.date);
      const now = clock(),
        startOfDay = DateTime.fromISO(date, { zone }).startOf("day");
      if (
        date < DateTime.fromJSDate(now, { zone }).toISODate()! ||
        startOfDay.toMillis() > now.getTime() + 366 * 86400000
      )
        throw new AppError(
          "INVALID_INPUT",
          "Choose a date within the next year.",
        );
      const service = found(
        await uow.read.services.findById(serviceId),
        "Service",
      );
      if (!service.isActive)
        throw new AppError("CONFLICT", "This service is inactive.");
      const schedule = found(
        await uow.read.schedules.get(staffId),
        "Staff schedule",
      );
      let original: Appointment | null = null;
      if (data.appointmentId) {
        original = found(
          await uow.read.appointments.get(id(data.appointmentId)),
          "Appointment",
        );
        authorizeAppointment(actor, original);
        if (
          original.serviceId !== serviceId ||
          !["Pending", "Confirmed"].includes(original.status)
        )
          throw new AppError(
            "CONFLICT",
            "This appointment cannot be rescheduled.",
          );
      }
      const duration = original?.durationMinutes ?? service.durationMinutes;
      const reservations = await uow.read.appointments.forStaff(
        staffId,
        startOfDay.toJSDate(),
      );
      const slots: { startAt: string; endAt: string }[] = [];
      const endOfDay = startOfDay.plus({ days: 1 }).toMillis();
      for (
        let ms = startOfDay.toMillis();
        ms < endOfDay;
        ms += slotMinutes * 60000
      ) {
        const start = new Date(ms),
          end = new Date(ms + duration * 60000);
        if (
          start <= now ||
          !fitsSchedule(schedule, serviceId, start, end, zone)
        )
          continue;
        if (
          reservations.some(
            (a) =>
              a.id !== original?.id && overlaps(start, end, a.startAt, a.endAt),
          )
        )
          continue;
        slots.push({ startAt: start.toISOString(), endAt: end.toISOString() });
      }
      return {
        slots,
        timeZone: zone,
        service: {
          ...service,
          durationMinutes: duration,
          priceCents: original?.priceCents ?? service.priceCents,
        },
      };
    },
    async book(actor: Actor, input: unknown, rawKey: unknown) {
      if (actor.role !== "customer")
        throw new AppError("FORBIDDEN", "Use a customer account to book.");
      const data = record(input),
        serviceId = id(data.serviceId),
        staffId = id(data.staffId),
        startAt = instant(data.startAt);
      const key = text(rawKey, "Idempotency-Key", 128);
      const fingerprint = createHash("sha256")
        .update(
          JSON.stringify({
            serviceId,
            staffId,
            startAt: startAt.toISOString(),
          }),
        )
        .digest("hex");
      return uow.run(async (store) => {
        await store.lockCustomer(actor.id);
        const replay = await store.replay.get(actor.id, key);
        if (replay) {
          if (replay.fingerprint !== fingerprint)
            throw new AppError(
              "IDEMPOTENCY_CONFLICT",
              "This request key was already used for different booking details.",
            );
          return replay.result;
        }
        const service = found(await store.lockService(serviceId), "Service");
        if (!service.isActive)
          throw new AppError("CONFLICT", "This service is inactive.");
        // This common write must happen BEFORE the overlap query in the same transaction.
        const schedule = found(
          await store.schedules.lock(staffId),
          "Staff schedule",
        );
        const employee = found(await store.users.findById(staffId), "Employee");
        if (employee.role !== "staff")
          throw new AppError("INVALID_INPUT", "Choose a staff member.");
        const endAt = new Date(
          startAt.getTime() + service.durationMinutes * 60000,
        );
        assertBookingTime(
          startAt,
          endAt,
          schedule,
          serviceId,
          clock(),
          zone,
          slotMinutes,
        );
        if (await store.appointments.overlaps(staffId, startAt, endAt))
          throw new AppError(
            "SLOT_UNAVAILABLE",
            "That time was just taken. Please choose another slot.",
          );
        const appointment = await store.appointments.create({
          reference: `APT-${randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`,
          customerId: actor.id,
          serviceId,
          staffId,
          startAt,
          endAt,
          status: "Pending",
          serviceName: service.name,
          priceCents: service.priceCents,
          durationMinutes: service.durationMinutes,
          revision: 0,
        });
        await store.replay.save(actor.id, key, fingerprint, appointment);
        return appointment;
      });
    },
    async get(actor: Actor, appointmentId: unknown) {
      const appointment = found(
        await uow.read.appointments.get(id(appointmentId)),
        "Appointment",
      );
      authorizeAppointment(actor, appointment);
      return appointment;
    },
    async reschedule(actor: Actor, appointmentId: unknown, input: unknown) {
      const targetId = id(appointmentId),
        data = record(input),
        staffId = id(data.staffId),
        startAt = instant(data.startAt);
      return uow.run(async (store) => {
        let old = found(await store.appointments.get(targetId), "Appointment");
        authorizeAppointment(actor, old);
        const service = found(
          await store.lockService(old.serviceId),
          "Service",
        );
        if (!service.isActive)
          throw new AppError(
            "CONFLICT",
            "This service is inactive; contact the administrator.",
          );
        for (const employeeId of [...new Set([old.staffId, staffId])].sort())
          found(await store.schedules.lock(employeeId), "Staff schedule");
        old = found(await store.appointments.get(targetId), "Appointment");
        if (!["Pending", "Confirmed"].includes(old.status))
          throw new AppError(
            "CONFLICT",
            "This appointment cannot be rescheduled.",
          );
        if (actor.role === "staff") operator(actor, staffId);
        if (
          old.staffId === staffId &&
          old.startAt.getTime() === startAt.getTime()
        )
          return old;
        const schedule = found(
          await store.schedules.get(staffId),
          "Staff schedule",
        );
        const employee = found(await store.users.findById(staffId), "Employee");
        if (employee.role !== "staff")
          throw new AppError("INVALID_INPUT", "Choose a staff member.");
        const endAt = new Date(startAt.getTime() + old.durationMinutes * 60000);
        assertBookingTime(
          startAt,
          endAt,
          schedule,
          old.serviceId,
          clock(),
          zone,
          slotMinutes,
        );
        if (await store.appointments.overlaps(staffId, startAt, endAt, old.id))
          throw new AppError(
            "SLOT_UNAVAILABLE",
            "That time is unavailable. Your original booking has been kept.",
          );
        const changed = await store.appointments.update(old.id, {
          staffId,
          startAt,
          endAt,
          status: "Pending",
          revision: old.revision + 1,
        });
        await notify(store, changed, "rescheduled");
        return changed;
      });
    },
    async confirm(actor: Actor, appointmentId: unknown) {
      return uow.run(async (store) => {
        const appointment = found(
          await store.appointments.get(id(appointmentId)),
          "Appointment",
        );
        operator(actor, appointment.staffId);
        await store.schedules.lock(appointment.staffId);
        if (appointment.status !== "Pending" || appointment.startAt <= clock())
          throw new AppError(
            "CONFLICT",
            "Only future pending appointments can be confirmed.",
          );
        const changed = await store.appointments.update(appointment.id, {
          status: "Confirmed",
          revision: appointment.revision + 1,
        });
        await notify(store, changed, "confirmed");
        return changed;
      });
    },
    async cancel(actor: Actor, appointmentId: unknown) {
      return uow.run(async (store) => {
        await store.lockQueue();
        const appointment = found(
          await store.appointments.get(id(appointmentId)),
          "Appointment",
        );
        authorizeAppointment(actor, appointment);
        await store.schedules.lock(appointment.staffId);
        const allowed =
          actor.role === "customer"
            ? ["Pending", "Confirmed"]
            : ["Pending", "Confirmed", "CheckedIn"];
        if (!allowed.includes(appointment.status))
          throw new AppError(
            "CONFLICT",
            "This appointment cannot be cancelled.",
          );
        const changed = await store.appointments.update(appointment.id, {
          status: "Cancelled",
          revision: appointment.revision + 1,
        });
        const entry = await store.queue.byAppointment(appointment.id);
        if (entry) await store.queue.update(entry.id, { status: "Cancelled" });
        await notify(store, changed, "cancelled");
        return changed;
      });
    },
    async markNoShows() {
      const cutoff = new Date(clock().getTime() - graceMinutes * 60000);
      const candidates = await uow.read.appointments.noShowCandidates(cutoff);
      let count = 0;
      for (const candidate of candidates) {
        const changed = await uow.run(async (store) => {
          await store.schedules.lock(candidate.staffId);
          const appointment = await store.appointments.get(candidate.id);
          if (
            !appointment ||
            appointment.status !== "Confirmed" ||
            appointment.startAt >= cutoff
          )
            return false;
          const updated = await store.appointments.update(appointment.id, {
            status: "NoShow",
            revision: appointment.revision + 1,
          });
          await notify(store, updated, "marked as no-show");
          return true;
        });
        if (changed) count++;
      }
      return count;
    },
  };
}
