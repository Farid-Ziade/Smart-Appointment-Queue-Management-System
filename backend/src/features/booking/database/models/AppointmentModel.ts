import { Schema, model } from "mongoose";
import { appointmentStatuses } from "../../business/Appointment.js";
const schema = new Schema(
  {
    reference: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    serviceId: { type: Schema.Types.ObjectId, ref: "Service", required: true },
    staffId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    startAt: { type: Date, required: true },
    endAt: { type: Date, required: true },
    status: { type: String, enum: appointmentStatuses, required: true },
    serviceName: { type: String, required: true },
    priceCents: {
      type: Number,
      required: true,
      min: 0,
      validate: Number.isSafeInteger,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
      validate: Number.isSafeInteger,
    },
    revision: { type: Number, required: true, default: 0 },
    completedAt: Date,
  },
  { timestamps: true },
);
schema.index({ staffId: 1, startAt: 1, endAt: 1, status: 1 });
schema.index({ customerId: 1, startAt: -1 });
schema.index({ status: 1, startAt: 1 });
export const AppointmentModel = model("Appointment", schema, "appointments");
