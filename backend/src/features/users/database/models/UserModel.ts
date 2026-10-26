import { Schema, model } from "mongoose";

const userSchema = new Schema(
  {
    requestVersion: { type: Number, default: 0 },
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "staff", "customer"] as const,
      required: true,
      default: "customer",
    },
  },
  {
    timestamps: true,
  },
);

export const UserModel = model("User", userSchema, "users");
