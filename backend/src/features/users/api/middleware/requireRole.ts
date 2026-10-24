import type { RequestHandler } from "express";

import type { UserProfile, UserRole } from "../../business/User.js";

import { AppError } from "../../../../shared/errors/AppError.js";

export function requireRole(...allowedRoles: UserRole[]): RequestHandler {
  return (_req, res, next) => {
    const user: UserProfile | undefined = res.locals.user;

    if (!user) {
      throw new AppError("UNAUTHORIZED", "Please log in to continue.");
    }

    if (!allowedRoles.includes(user.role)) {
      throw new AppError(
        "FORBIDDEN",
        "You do not have permission to perform this action.",
      );
    }

    next();
  };
}
