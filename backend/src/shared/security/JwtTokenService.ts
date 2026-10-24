import jwt from "jsonwebtoken";

import type { TokenService } from "./TokenService.js";
import { AppError } from "../errors/AppError.js";

const ISSUER = "smart-appointment-api";
const AUDIENCE = "smart-appointment-web";

export function createJwtTokenService(secret: string): TokenService {
  if (!/^[0-9a-f]{64}$/i.test(secret)) {
    throw new Error("JWT_SECRET must contain 64 hexadecimal characters.");
  }

  const signingKey = Buffer.from(secret, "hex");

  return {
    async createAccessToken(userId: string): Promise<string> {
      return jwt.sign({}, signingKey, {
        algorithm: "HS256",
        subject: userId,
        issuer: ISSUER,
        audience: AUDIENCE,
        expiresIn: "1h",
      });
    },

    async verifyAccessToken(token: string): Promise<string> {
      try {
        const payload = jwt.verify(token, signingKey, {
          algorithms: ["HS256"],
          issuer: ISSUER,
          audience: AUDIENCE,
        });

        if (
          typeof payload === "string" ||
          !payload ||
          typeof payload.sub !== "string" ||
          payload.sub.length === 0 ||
          typeof payload.exp !== "number"
        ) {
          throw new Error("Invalid token contents.");
        }

        return payload.sub;
      } catch {
        throw new AppError("UNAUTHORIZED", "Invalid or expired access token.");
      }
    },
  };
}
