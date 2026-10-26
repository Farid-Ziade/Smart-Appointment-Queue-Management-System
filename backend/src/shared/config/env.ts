import { DateTime } from "luxon";
function positive(name: string, fallback: number) {
  const value = Number(process.env[name] ?? fallback);
  if (!Number.isSafeInteger(value) || value <= 0)
    throw new Error(`${name} must be a positive integer.`);
  return value;
}
const zone = process.env.BUSINESS_TIME_ZONE || "Asia/Beirut";
if (!DateTime.now().setZone(zone).isValid)
  throw new Error("Invalid BUSINESS_TIME_ZONE.");
export const config = {
  port: positive("PORT", 5000),
  zone,
  currency: process.env.CURRENCY || "USD",
  slotMinutes: positive("SLOT_MINUTES", 15),
  graceMinutes: positive("NO_SHOW_GRACE_MINUTES", 15),
  webOrigin: process.env.WEB_ORIGIN || "http://localhost:5173",
};
if (
  config.port > 65535 ||
  config.slotMinutes > 60 ||
  60 % config.slotMinutes !== 0
)
  throw new Error("Invalid port or slot interval.");
