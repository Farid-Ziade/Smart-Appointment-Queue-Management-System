import { randomUUID, createHash } from "node:crypto";
import nodemailer from "nodemailer";
import { OutboxModel } from "../database/TechnicalModels.js";
export interface MailMessage {
  to: string;
  subject: string;
  text: string;
  messageId: string;
}
export interface MailSender {
  send(message: MailMessage): Promise<void>;
}
export function createMailSender(): MailSender | null {
  const mode = process.env.MAIL_MODE || "disabled";
  if (mode === "disabled") return null;
  if (mode === "preview")
    return {
      async send(message) {
        console.log("EMAIL PREVIEW (not delivered):", JSON.stringify(message));
      },
    };
  if (mode !== "smtp" || !process.env.SMTP_HOST || !process.env.SMTP_FROM)
    throw new Error("Configure MAIL_MODE, SMTP_HOST and SMTP_FROM.");
  const port = Number(process.env.SMTP_PORT || 587);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65535)
    throw new Error("Invalid SMTP_PORT.");
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: process.env.SMTP_SECURE === "true",
    ...(process.env.SMTP_USER
      ? {
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        }
      : {}),
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
  return {
    async send(message) {
      await transport.sendMail({ from: process.env.SMTP_FROM, ...message });
    },
  };
}
export function createOutboxWorker(
  sender: MailSender | null,
  clock = () => new Date(),
) {
  let running = false;
  return {
    async deliver(limit = 20) {
      if (!sender || running) return 0;
      running = true;
      let delivered = 0;
      try {
        for (let index = 0; index < limit; index++) {
          const now = clock(),
            owner = randomUUID();
          const item = await OutboxModel.findOneAndUpdate(
            {
              sentAt: { $exists: false },
              availableAt: { $lte: now },
              $or: [
                { leaseUntil: { $exists: false } },
                { leaseUntil: { $lte: now } },
              ],
            },
            {
              $set: {
                leaseUntil: new Date(now.getTime() + 120000),
                leaseOwner: owner,
              },
              $inc: { attempts: 1 },
            },
            { returnDocument: "after", sort: { createdAt: 1 } },
          );
          if (!item) break;
          try {
            const messageId = `<${createHash("sha256").update(item.key).digest("hex")}@smart-appointment>`;
            await sender.send({
              to: item.to,
              subject: item.subject,
              text: item.text,
              messageId,
            });
            await OutboxModel.updateOne(
              { _id: item._id, leaseOwner: owner },
              {
                $set: { sentAt: clock() },
                $unset: { leaseUntil: "", leaseOwner: "", lastError: "" },
              },
            );
            delivered++;
          } catch (error) {
            await OutboxModel.updateOne(
              { _id: item._id, leaseOwner: owner },
              {
                $set: {
                  availableAt: new Date(
                    clock().getTime() +
                      Math.min(3600, 30 * 2 ** Math.min(item.attempts, 7)) *
                        1000,
                  ),
                  lastError:
                    error instanceof Error ? error.name : "DeliveryError",
                },
                $unset: { leaseUntil: "", leaseOwner: "" },
              },
            );
          }
        }
        return delivered;
      } finally {
        running = false;
      }
    },
  };
}
