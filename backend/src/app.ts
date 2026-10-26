import express, { type ErrorRequestHandler } from "express";
import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import type { System } from "./compositionRoot.js";
import { AppError } from "./shared/errors/AppError.js";
import { requireRole } from "./features/users/api/middleware/requireRole.js";
import { config } from "./shared/config/env.js";
export function createApp(system: System) {
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use((_req, res, next) => {
    res.locals.requestId = randomUUID();
    res.set("X-Request-ID", res.locals.requestId);
    next();
  });
  app.use(express.json({ limit: "20kb" }));
  if (process.env.NODE_ENV !== "test") {
    app.use(
      "/api",
      rateLimit({
        windowMs: 60000,
        limit: 300,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          code: "RATE_LIMITED",
          message: "Too many requests. Please try again shortly.",
        },
      }),
    );
    const loginLimit = rateLimit({
      windowMs: 15 * 60000,
      limit: 30,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        code: "RATE_LIMITED",
        message: "Too many authentication attempts. Please try again later.",
      },
    });
    app.use(["/api/auth/login", "/api/auth/register"], loginLimit);
  }
  app.get("/api/health", (_req, res) =>
    res.json({ message: "Appointment API is running" }),
  );
  app.get("/api/config", (_req, res) =>
    res.json({
      timeZone: config.zone,
      currency: config.currency,
      slotMinutes: config.slotMinutes,
    }),
  );
  app.use("/api/auth", system.authRouter);
  app.use("/api/services", system.serviceRouter);
  app.use("/api/staff", system.staffRouter);
  app.use("/api", system.bookingRouter);
  app.use("/api/queue", system.queueRouter);
  app.get(
    "/api/dashboard",
    system.auth,
    requireRole("admin"),
    async (req, res) =>
      res.json(await system.reads.dashboard(res.locals.user, req.query)),
  );
  app.use("/api", (_req, _res, next) =>
    next(new AppError("NOT_FOUND", "Endpoint not found.")),
  );
  const frontend = fileURLToPath(
    new URL("../../frontend/dist/", import.meta.url),
  );
  if (existsSync(frontend + "index.html")) {
    app.use(express.static(frontend));
    app.get("/{*splat}", (_req, res) => res.sendFile(frontend + "index.html"));
  }
  const errors: ErrorRequestHandler = (error: unknown, _req, res, next) => {
    if (res.headersSent) return next(error);
    let status = 500,
      code = "INTERNAL_ERROR",
      message = "Something went wrong. Please try again.";
    if (error instanceof AppError) {
      status = {
        INVALID_INPUT: 400,
        EMAIL_IN_USE: 409,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        SLOT_UNAVAILABLE: 409,
        IDEMPOTENCY_CONFLICT: 409,
      }[error.code];
      code = error.code;
      message = error.message;
    } else if (error instanceof Error) {
      if ("type" in error && error.type === "entity.parse.failed") {
        status = 400;
        code = "INVALID_INPUT";
        message = "Invalid JSON body.";
      } else if ("type" in error && error.type === "entity.too.large") {
        status = 413;
        code = "INVALID_INPUT";
        message = "Request body is too large.";
      } else if (
        error.name === "ValidationError" ||
        error.name === "CastError"
      ) {
        status = 400;
        code = "INVALID_INPUT";
        message = "One or more fields are invalid.";
      } else if ("code" in error && error.code === 11000) {
        status = 409;
        code = "CONFLICT";
        message = "A record with those details already exists.";
      }
    }
    if (status === 500)
      console.error(
        "Request failed",
        res.locals.requestId,
        error instanceof Error ? error.name : "Unknown error",
      );
    res.status(status).json({ code, message, requestId: res.locals.requestId });
  };
  app.use(errors);
  return app;
}
