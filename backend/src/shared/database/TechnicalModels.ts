import { Schema, model } from "mongoose";
const replay = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    key: { type: String, required: true },
    fingerprint: { type: String, required: true },
    result: { type: Schema.Types.Mixed, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);
replay.index({ customerId: 1, key: 1 }, { unique: true });
replay.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const IdempotencyModel = model(
  "IdempotencyRequest",
  replay,
  "idempotencyRequests",
);
const outbox = new Schema(
  {
    key: { type: String, required: true, unique: true },
    to: { type: String, required: true },
    subject: { type: String, required: true },
    text: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    availableAt: { type: Date, default: Date.now },
    leaseUntil: Date,
    leaseOwner: String,
    sentAt: Date,
    lastError: String,
  },
  { timestamps: true },
);
outbox.index({ sentAt: 1, availableAt: 1, leaseUntil: 1 });
export const OutboxModel = model(
  "NotificationOutbox",
  outbox,
  "notificationOutbox",
);
const revoked = new Schema({
  _id: String,
  expiresAt: { type: Date, required: true },
});
revoked.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
export const RevokedTokenModel = model(
  "RevokedToken",
  revoked,
  "revokedTokens",
);
