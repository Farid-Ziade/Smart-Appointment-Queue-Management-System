import type { RequestHandler } from "express";

import type { UserRepository } from "../../business/repositories/UserRepository.js";
import type { TokenService } from "../../../../shared/security/TokenService.js";

import { AppError } from "../../../../shared/errors/AppError.js";

export function createRequireAuth(
  userRepository: UserRepository,
  tokenService: TokenService,
): RequestHandler {
  return async (req, res, next) => {
    res.set("Cache-Control", "no-store");

    const authorization = req.get("Authorization");
    const token = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];

    if (!token) {
      throw new AppError("UNAUTHORIZED", "Please log in to continue.");
    }

    const userId = await tokenService.verifyAccessToken(token);

    const user = await userRepository.findById(userId);

    if (user === null) {
      throw new AppError(
        "UNAUTHORIZED",
        "This account is no longer available.",
      );
    }

    res.locals.user = user;

    next();
  };
}
