import { Router } from "express";

import type { UserRepository } from "../business/repositories/UserRepository.js";
import type { PasswordHasher } from "../../../shared/security/PasswordHasher.js";

import { registerUser } from "../use-cases/RegisterUser.js";
import { AppError } from "../../../shared/errors/AppError.js";

export function createAuthRouter(
  userRepository: UserRepository,
  passwordHasher: PasswordHasher,
) {
  const router = Router();

  router.post("/register", async (req, res) => {
    const body = req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new AppError("INVALID_INPUT", "Send a JSON object.");
    }

    const { fullName, email, phone, password } = body;

    if (
      typeof fullName !== "string" ||
      typeof email !== "string" ||
      typeof phone !== "string" ||
      typeof password !== "string"
    ) {
      throw new AppError(
        "INVALID_INPUT",
        "Full name, email, phone, and password must be strings.",
      );
    }

    const user = await registerUser(
      { fullName, email, phone, password },
      userRepository,
      passwordHasher,
    );

    res.status(201).json({
      message: "Account created successfully.",
      user,
    });
  });

  return router;
}
