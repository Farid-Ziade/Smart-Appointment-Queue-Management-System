import express from "express";
import type { ErrorRequestHandler } from "express";

import { authRouter } from "./compositionRoot.js";
import { AppError } from "./shared/errors/AppError.js";

const app = express();

app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (req, res) => {
  res.json({
    message: "Appointment API is running",
  });
});

app.use("/api/auth", authRouter);

const errorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof AppError) {
    const status = {
      INVALID_INPUT: 400,
      EMAIL_IN_USE: 409,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
    }[error.code];

    res.status(status).json({ message: error.message });
    return;
  }

  if (error instanceof Error && "type" in error) {
    if (error.type === "entity.parse.failed") {
      res.status(400).json({ message: "Invalid JSON body." });
      return;
    }

    if (error.type === "entity.too.large") {
      res.status(413).json({ message: "Request body is too large." });
      return;
    }
  }

  console.error(
    "Unexpected request failure:",
    error instanceof Error ? error.name : "Unknown error",
  );

  res.status(500).json({
    message: "Something went wrong. Please try again.",
  });
};

app.use(errorHandler);

export default app;
