import { Router } from "express";

import type { UserRepository } from "../business/repositories/UserRepository.js";
import type { PasswordHasher } from "../../../shared/security/PasswordHasher.js";

import { registerUser } from "../use-cases/RegisterUser.js";
import { AppError } from "../../../shared/errors/AppError.js";

import type { TokenService } from "../../../shared/security/TokenService.js";
import { loginUser } from "../use-cases/LoginUser.js";

import { createRequireAuth } from "./middleware/requireAuth.js";

export function createAuthRouter(
  userRepository: UserRepository,
  passwordHasher: PasswordHasher,
  tokenService: TokenService,
) {
  const router = Router();

  const requireAuth = createRequireAuth(userRepository, tokenService);

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

  router.post("/login", async (req, res) => {
    const body = req.body;

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new AppError("INVALID_INPUT", "Send a JSON object.");
    }

    const { email, password } = body;

    if (typeof email !== "string" || typeof password !== "string") {
      throw new AppError(
        "INVALID_INPUT",
        "Email and password must be strings.",
      );
    }

    const result = await loginUser(
      { email, password },
      userRepository,
      passwordHasher,
      tokenService,
    );

    res.set("Cache-Control", "no-store");

    res.status(200).json({
      message: "Login successful.",
      accessToken: result.accessToken,
      user: result.user,
    });
  });

  router.get("/me", requireAuth, (_req, res) => {
    res.json({
      user: res.locals.user,
    });
  });

  router.post("/logout", requireAuth, async (req, res) => {
    const token = req.get("Authorization")!.match(/^Bearer\s+(\S+)$/i)![1]!;
    await tokenService.revokeAccessToken(token);
    res.status(204).end();
  });

  return router;
}
