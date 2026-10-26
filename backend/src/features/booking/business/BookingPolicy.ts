import { DateTime } from "luxon";
import type { ScheduleData } from "./StaffSchedule.js";
import { AppError } from "../../../shared/errors/AppError.js";
export function overlaps(
  start: Date,
  end: Date,
  otherStart: Date,
  otherEnd: Date,
) {
  return start < otherEnd && end > otherStart;
}
export function fitsSchedule(
  schedule: ScheduleData,
  serviceId: string,
  start: Date,
  end: Date,
  zone: string,
) {
  const localStart = DateTime.fromJSDate(start, { zone });
  const date = localStart.toISODate()!;
  if (
    end <= start ||
    !schedule.serviceIds.includes(serviceId) ||
    schedule.daysOff.includes(date)
  )
    return false;
  // Check actual elapsed minutes. This also handles skipped/repeated hours at DST changes.
  return schedule.weekly.some((interval) => {
    if (interval.weekday !== localStart.weekday) return false;
    for (let ms = start.getTime(); ms < end.getTime(); ms += 60000) {
      const local = DateTime.fromMillis(ms, { zone });
      const minute = local.hour * 60 + local.minute;
      if (
        local.toISODate() !== date ||
        minute < interval.startMinute ||
        minute >= interval.endMinute
      )
        return false;
    }
    return true;
  });
}
export function assertBookingTime(
  start: Date,
  end: Date,
  schedule: ScheduleData,
  serviceId: string,
  now: Date,
  zone: string,
  slotMinutes: number,
) {
  const local = DateTime.fromJSDate(start, { zone });
  if (start <= now || start.getTime() > now.getTime() + 366 * 86400000)
    throw new AppError(
      "INVALID_INPUT",
      "Choose a future time within the next year.",
    );
  if (
    (start.getTime() - local.startOf("day").toMillis()) %
      (slotMinutes * 60000) !==
    0
  )
    throw new AppError(
      "INVALID_INPUT",
      "Choose a time from the available slots.",
    );
  if (!fitsSchedule(schedule, serviceId, start, end, zone))
    throw new AppError(
      "SLOT_UNAVAILABLE",
      "This employee is unavailable or unqualified for that time.",
    );
}
