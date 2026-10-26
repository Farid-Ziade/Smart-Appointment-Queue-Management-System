import { Schema, model } from "mongoose";
export const serviceSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 480,
      validate: Number.isSafeInteger,
    },
    priceCents: {
      type: Number,
      required: true,
      min: 0,
      max: 100000000,
      validate: Number.isSafeInteger,
    },
    isActive: { type: Boolean, required: true, default: true },
    bookingVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);
serviceSchema.index({ isActive: 1, name: 1 });
export const ServiceModel = model("Service", serviceSchema, "services");
