import jwt from "jsonwebtoken";
import { createHash, randomUUID } from "node:crypto";
import type { TokenService } from "./TokenService.js";
import { AppError } from "../errors/AppError.js";
import { RevokedTokenModel } from "../database/TechnicalModels.js";
const issuer = "smart-appointment-api",
  audience = "smart-appointment-web";
export function createJwtTokenService(secret: string): TokenService {
  if (!/^[0-9a-f]{64}$/i.test(secret))
    throw new Error("JWT_SECRET must contain 64 hexadecimal characters.");
  const key = Buffer.from(secret, "hex");
  const hash = (token: string) =>
    createHash("sha256").update(token).digest("hex");
  function payload(token: string) {
    try {
      const result = jwt.verify(token, key, {
        algorithms: ["HS256"],
        issuer,
        audience,
      });
      if (
        typeof result === "string" ||
        typeof result.sub !== "string" ||
        !result.sub ||
        typeof result.exp !== "number"
      )
        throw new Error("Invalid token contents.");
      return { userId: result.sub, expiresAt: new Date(result.exp * 1000) };
    } catch {
      throw new AppError("UNAUTHORIZED", "Invalid or expired access token.");
    }
  }
  return {
    async createAccessToken(userId) {
      return jwt.sign({}, key, {
        algorithm: "HS256",
        subject: userId,
        jwtid: randomUUID(),
        issuer,
        audience,
        expiresIn: "1h",
      });
    },
    async verifyAccessToken(token) {
      const result = payload(token);
      if (await RevokedTokenModel.exists({ _id: hash(token) }))
        throw new AppError("UNAUTHORIZED", "This session has been logged out.");
      return result.userId;
    },
    async revokeAccessToken(token) {
      const result = payload(token);
      await RevokedTokenModel.updateOne(
        { _id: hash(token) },
        { $set: { expiresAt: result.expiresAt } },
        { upsert: true },
      );
    },
  };
}
