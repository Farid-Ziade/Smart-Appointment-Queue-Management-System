import type { ReadRepository } from "../business/ReadRepository.js";
import { AppointmentModel } from "../../booking/database/models/AppointmentModel.js";
import { QueueEntryModel } from "../../queue/database/models/QueueEntryModel.js";
import { plain } from "../../../shared/database/plain.js";
import { DateTime } from "luxon";
// Populated read models intentionally differ from the unpopulated business entities.
function appointmentView(document: unknown) {
  const row = plain<Record<string, any>>(document);
  return {
    ...row,
    customer: row.customerId,
    staff: row.staffId,
    customerId: row.customerId?.id,
    staffId: row.staffId?.id,
  };
}
export const mongoReadRepository: ReadRepository = {
  async appointments(actor, from, to, search, page) {
    const filter = {
      startAt: { $gte: from, $lt: to },
      ...(actor.role === "customer"
        ? { customerId: actor.id }
        : actor.role === "staff"
          ? { staffId: actor.id }
          : {}),
      ...(search
        ? {
            reference: {
              $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
              $options: "i",
            },
          }
        : {}),
    };
    const [total, documents] = await Promise.all([
      AppointmentModel.countDocuments(filter),
      AppointmentModel.find(filter)
        .sort({ startAt: 1, _id: 1 })
        .skip((page - 1) * 25)
        .limit(25)
        .populate("customerId", "fullName email phone")
        .populate("staffId", "fullName"),
    ]);
    return {
      appointments: documents.map(appointmentView),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / 25)),
    };
  },
  async queue(actor, day) {
    const entries = await QueueEntryModel.find({
      day,
      status: { $in: ["Waiting", "Called", "InService"] },
      ...(actor.role === "staff" ? { staffId: actor.id } : {}),
    })
      .sort({ priority: -1, checkedInAt: 1, number: 1 })
      .populate({
        path: "appointmentId",
        populate: [
          { path: "customerId", select: "fullName" },
          { path: "staffId", select: "fullName" },
        ],
      });
    return {
      day,
      entries: entries.map((document) => {
        const row = plain<Record<string, any>>(document);
        return {
          ...row,
          label: `A-${String(row.number).padStart(3, "0")}`,
          appointment: row.appointmentId,
          appointmentId: row.appointmentId?.id,
        };
      }),
    };
  },
  async dashboard(from, to, day, chartFrom, zone) {
    const [summary, chart, waiting] = await Promise.all([
      AppointmentModel.aggregate([
        { $match: { startAt: { $gte: from, $lt: to } } },
        {
          $group: {
            _id: null,
            appointments: { $sum: 1 },
            completed: {
              $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ["$status", "Cancelled"] }, 1, 0] },
            },
            noShows: {
              $sum: { $cond: [{ $eq: ["$status", "NoShow"] }, 1, 0] },
            },
            revenueCents: {
              $sum: {
                $cond: [{ $eq: ["$status", "Completed"] }, "$priceCents", 0],
              },
            },
          },
        },
      ]),
      AppointmentModel.aggregate([
        { $match: { startAt: { $gte: chartFrom, $lt: to } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$startAt",
                timezone: zone,
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
      QueueEntryModel.countDocuments({
        day,
        status: { $in: ["Waiting", "Called"] },
      }),
    ]);
    const counts = new Map(chart.map((row) => [row._id, row.count]));
    const volume = Array.from({ length: 7 }, (_, index) => {
      const date = DateTime.fromJSDate(chartFrom, { zone })
        .plus({ days: index })
        .toISODate()!;
      return { date, count: counts.get(date) ?? 0 };
    });
    const metrics = summary[0] ?? {
      appointments: 0,
      completed: 0,
      cancelled: 0,
      noShows: 0,
      revenueCents: 0,
    };
    delete metrics._id;
    return { metrics: { ...metrics, waiting }, volume };
  },
};
