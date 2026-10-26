import mongoose, { type ClientSession } from "mongoose";
import type { Store, UnitOfWork } from "../ports/UnitOfWork.js";
import { AppError } from "../errors/AppError.js";
import {
  createMongoServiceRepository,
  mapService,
} from "../../features/services/database/repositories/MongoServiceRepository.js";
import { ServiceModel } from "../../features/services/database/models/ServiceModel.js";
import { createMongoUserRepository } from "../../features/users/database/repositories/MongoUserRepository.js";
import { UserModel } from "../../features/users/database/models/UserModel.js";
import { StaffScheduleModel } from "../../features/booking/database/models/StaffScheduleModel.js";
import { AppointmentModel } from "../../features/booking/database/models/AppointmentModel.js";
import { blockingStatuses } from "../../features/booking/business/Appointment.js";
import {
  QueueEntryModel,
  QueueCounterModel,
  OperationGuardModel,
} from "../../features/queue/database/models/QueueEntryModel.js";
import { IdempotencyModel, OutboxModel } from "./TechnicalModels.js";
import { plain } from "./plain.js";
export function mongoStore(session?: ClientSession): Store {
  const options = {
    session,
    returnDocument: "after" as const,
    runValidators: true,
  };
  return {
    services: createMongoServiceRepository(session),
    users: createMongoUserRepository(session),
    async staffUsers() {
      return plain(
        await UserModel.find({ role: "staff" })
          .select("fullName email phone role createdAt updatedAt")
          .sort({ fullName: 1 })
          .session(session ?? null),
      );
    },
    async lockCustomer(id) {
      const doc = await UserModel.findOneAndUpdate(
        { _id: id, role: "customer" },
        { $inc: { requestVersion: 1 } },
        options,
      );
      if (!doc)
        throw new AppError("FORBIDDEN", "A customer account is required.");
    },
    async lockService(id) {
      const doc = await ServiceModel.findByIdAndUpdate(
        id,
        { $inc: { bookingVersion: 1 } },
        options,
      );
      return doc ? mapService(doc) : null;
    },
    async lockQueue() {
      const doc = await OperationGuardModel.findByIdAndUpdate(
        "queue",
        { $inc: { version: 1 } },
        options,
      );
      if (!doc) throw new Error("Queue storage has not been initialized.");
    },
    schedules: {
      async get(staffId) {
        return plain(
          await StaffScheduleModel.findOne({ staffId }).session(
            session ?? null,
          ),
        );
      },
      async create(staffId) {
        const [doc] = await StaffScheduleModel.create([{ staffId }], {
          session,
        });
        return plain(doc);
      },
      async lock(staffId) {
        return plain(
          await StaffScheduleModel.findOneAndUpdate(
            { staffId },
            { $inc: { bookingVersion: 1 } },
            options,
          ),
        );
      },
      async update(staffId, data) {
        return plain(
          await StaffScheduleModel.findOneAndUpdate(
            { staffId },
            { $set: data },
            options,
          ),
        );
      },
    },
    appointments: {
      async get(id) {
        return plain(
          await AppointmentModel.findById(id).session(session ?? null),
        );
      },
      async byReference(reference) {
        return plain(
          await AppointmentModel.findOne({ reference }).session(
            session ?? null,
          ),
        );
      },
      async create(data) {
        const [doc] = await AppointmentModel.create([data], { session });
        return plain(doc);
      },
      async update(id, data) {
        const doc = await AppointmentModel.findByIdAndUpdate(
          id,
          { $set: data },
          options,
        );
        if (!doc) throw new AppError("NOT_FOUND", "Appointment not found.");
        return plain(doc);
      },
      async overlaps(staffId, startAt, endAt, excludeId) {
        return Boolean(
          await AppointmentModel.exists({
            staffId,
            status: { $in: blockingStatuses },
            startAt: { $lt: endAt },
            endAt: { $gt: startAt },
            ...(excludeId ? { _id: { $ne: excludeId } } : {}),
          }).session(session ?? null),
        );
      },
      async forStaff(staffId, from) {
        return plain(
          await AppointmentModel.find({
            staffId,
            status: { $in: blockingStatuses },
            endAt: { $gt: from },
          }).session(session ?? null),
        );
      },
      async noShowCandidates(cutoff) {
        return plain(
          await AppointmentModel.find({
            status: "Confirmed",
            startAt: { $lt: cutoff },
          })
            .sort({ startAt: 1 })
            .limit(100)
            .session(session ?? null),
        );
      },
    },
    queue: {
      async get(id) {
        return plain(
          await QueueEntryModel.findById(id).session(session ?? null),
        );
      },
      async byAppointment(appointmentId) {
        return plain(
          await QueueEntryModel.findOne({ appointmentId }).session(
            session ?? null,
          ),
        );
      },
      async create(data) {
        const [doc] = await QueueEntryModel.create([data], { session });
        return plain(doc);
      },
      async update(id, data) {
        const doc = await QueueEntryModel.findByIdAndUpdate(
          id,
          { $set: data },
          options,
        );
        if (!doc) throw new AppError("NOT_FOUND", "Queue entry not found.");
        return plain(doc);
      },
      async waiting(day, staffId) {
        return plain(
          await QueueEntryModel.findOne({ day, staffId, status: "Waiting" })
            .sort({ priority: -1, checkedInAt: 1, number: 1 })
            .session(session ?? null),
        );
      },
      async busy(day, staffId) {
        return Boolean(
          await QueueEntryModel.exists({
            day,
            staffId,
            status: { $in: ["Called", "InService"] },
          }).session(session ?? null),
        );
      },
      async nextNumber(day) {
        const doc = await QueueCounterModel.findByIdAndUpdate(
          day,
          { $inc: { value: 1 } },
          { ...options, upsert: true },
        );
        return doc!.value;
      },
    },
    replay: {
      async get(customerId, key) {
        const doc = await IdempotencyModel.findOne({ customerId, key }).session(
          session ?? null,
        );
        return doc
          ? { fingerprint: doc.fingerprint, result: doc.result }
          : null;
      },
      async save(customerId, key, fingerprint, result) {
        await IdempotencyModel.create(
          [
            {
              customerId,
              key,
              fingerprint,
              result,
              expiresAt: new Date(Date.now() + 86400000),
            },
          ],
          { session },
        );
      },
    },
    outbox: {
      async add(event) {
        await OutboxModel.updateOne(
          { key: event.key },
          { $setOnInsert: event },
          { upsert: true, session },
        );
      },
    },
  };
}
export const mongoUnitOfWork: UnitOfWork = {
  read: mongoStore(),
  async run(work) {
    return mongoose.connection.transaction(
      async (session) => work(mongoStore(session)),
      {
        readConcern: { level: "snapshot" },
        writeConcern: { w: "majority" },
        readPreference: "primary",
        maxCommitTimeMS: 10000,
      },
    );
  },
};
