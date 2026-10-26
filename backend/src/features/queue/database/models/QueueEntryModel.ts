import { Schema, model } from "mongoose";
const schema = new Schema(
  {
    appointmentId: {
      type: Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
    },
    staffId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    day: { type: String, required: true },
    number: { type: Number, required: true, min: 1 },
    priority: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      enum: ["Waiting", "Called", "InService", "Completed", "Cancelled"],
      required: true,
    },
    checkedInAt: { type: Date, required: true },
    calledAt: Date,
    startedAt: Date,
    completedAt: Date,
  },
  { timestamps: true },
);
schema.index({ day: 1, number: 1 }, { unique: true });
schema.index({ day: 1, staffId: 1, status: 1, priority: -1, checkedInAt: 1 });
export const QueueEntryModel = model("QueueEntry", schema, "queueEntries");
export const QueueCounterModel = model(
  "QueueCounter",
  new Schema({ _id: String, value: { type: Number, default: 0 } }),
  "queueCounters",
);
export const OperationGuardModel = model(
  "OperationGuard",
  new Schema({ _id: String, version: { type: Number, default: 0 } }),
  "operationGuards",
);
