import { Schema, model } from "mongoose";
const interval = new Schema(
  {
    weekday: {
      type: Number,
      required: true,
      min: 1,
      max: 7,
      validate: Number.isSafeInteger,
    },
    startMinute: {
      type: Number,
      required: true,
      min: 0,
      max: 1439,
      validate: Number.isSafeInteger,
    },
    endMinute: {
      type: Number,
      required: true,
      min: 1,
      max: 1440,
      validate: Number.isSafeInteger,
    },
  },
  { _id: false },
);
const schema = new Schema(
  {
    staffId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    serviceIds: [{ type: Schema.Types.ObjectId, ref: "Service" }],
    weekly: { type: [interval], default: [] },
    daysOff: { type: [String], default: [] },
    bookingVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);
export const StaffScheduleModel = model(
  "StaffSchedule",
  schema,
  "staffSchedules",
);
