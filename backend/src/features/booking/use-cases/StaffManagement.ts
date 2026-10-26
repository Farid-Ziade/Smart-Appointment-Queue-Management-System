import type { UnitOfWork } from "../../../shared/ports/UnitOfWork.js";
import type { PasswordHasher } from "../../../shared/security/PasswordHasher.js";
import type { Actor } from "./BookingService.js";
import { fitsSchedule } from "../business/BookingPolicy.js";
import type { ScheduleData } from "../business/StaffSchedule.js";
import { AppError } from "../../../shared/errors/AppError.js";
import {
  day,
  id,
  integer,
  record,
  text,
} from "../../../shared/validation/input.js";
function admin(actor: Actor) {
  if (actor.role !== "admin")
    throw new AppError("FORBIDDEN", "Administrator access is required.");
}
export function parseSchedule(input: unknown): ScheduleData {
  const data = record(input);
  if (
    !Array.isArray(data.serviceIds) ||
    data.serviceIds.length > 100 ||
    !Array.isArray(data.weekly) ||
    data.weekly.length > 28 ||
    !Array.isArray(data.daysOff) ||
    data.daysOff.length > 366
  )
    throw new AppError(
      "INVALID_INPUT",
      "Supply serviceIds, weekly intervals, and daysOff arrays.",
    );
  const weekly = data.weekly
    .map((value) => {
      const interval = record(value);
      return {
        weekday: integer(interval.weekday, "Weekday", 1, 7),
        startMinute: integer(interval.startMinute, "Opening minute", 0, 1439),
        endMinute: integer(interval.endMinute, "Closing minute", 1, 1440),
      };
    })
    .sort((a, b) => a.weekday - b.weekday || a.startMinute - b.startMinute);
  weekly.forEach((item, index) => {
    const previous = weekly[index - 1];
    if (
      item.endMinute <= item.startMinute ||
      (previous &&
        previous.weekday === item.weekday &&
        previous.endMinute > item.startMinute)
    )
      throw new AppError(
        "INVALID_INPUT",
        "Working intervals must have a positive duration and must not overlap.",
      );
  });
  return {
    serviceIds: [
      ...new Set(data.serviceIds.map((value) => id(value, "Service ID"))),
    ],
    weekly,
    daysOff: [...new Set(data.daysOff.map(day))],
  };
}
export function createStaffManagement(
  uow: UnitOfWork,
  hasher: PasswordHasher,
  zone: string,
  clock = () => new Date(),
) {
  return {
    async list(serviceId?: unknown) {
      const filterId = serviceId ? id(serviceId) : undefined;
      const staff = await uow.read.staffUsers();
      const result = [];
      for (const employee of staff) {
        const schedule = await uow.read.schedules.get(employee.id);
        if (!filterId || schedule?.serviceIds.includes(filterId))
          result.push({ ...employee, schedule });
      }
      return result;
    },
    async create(actor: Actor, input: unknown) {
      admin(actor);
      const data = record(input);
      const fullName = text(data.fullName, "Full name"),
        email = text(data.email, "Email").toLowerCase(),
        phone = text(data.phone, "Phone");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        throw new AppError("INVALID_INPUT", "Invalid email.");
      if (
        typeof data.password !== "string" ||
        data.password.length < 8 ||
        Buffer.byteLength(data.password, "utf8") > 72
      )
        throw new AppError(
          "INVALID_INPUT",
          "Use a password of at least 8 characters and at most 72 UTF-8 bytes.",
        );
      const passwordHash = await hasher.hash(data.password);
      return uow.run(async (store) => {
        const user = await store.users.create({
          fullName,
          email,
          phone,
          passwordHash,
          role: "staff",
        });
        await store.schedules.create(user.id);
        const { passwordHash: _hash, ...profile } = user;
        return profile;
      });
    },
    async updateSchedule(actor: Actor, staffId: unknown, input: unknown) {
      admin(actor);
      const employeeId = id(staffId),
        data = parseSchedule(input);
      return uow.run(async (store) => {
        const schedule = await store.schedules.lock(employeeId);
        if (!schedule)
          throw new AppError("NOT_FOUND", "Staff schedule not found.");
        for (const serviceId of data.serviceIds)
          if (!(await store.services.findById(serviceId)))
            throw new AppError(
              "INVALID_INPUT",
              "A selected service does not exist.",
            );
        const future = await store.appointments.forStaff(employeeId, clock());
        if (
          future.some(
            (a) => !fitsSchedule(data, a.serviceId, a.startAt, a.endAt, zone),
          )
        )
          throw new AppError(
            "CONFLICT",
            "This change would invalidate existing appointments. Reschedule or cancel them first.",
          );
        return store.schedules.update(employeeId, data);
      });
    },
  };
}
