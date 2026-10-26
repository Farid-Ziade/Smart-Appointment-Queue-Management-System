import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import type { System } from "../../compositionRoot.js";
import { mongoUserRepository } from "../../features/users/database/repositories/MongoUserRepository.js";
import { config } from "../config/env.js";
export function attachQueueSocket(server: HttpServer, system: System) {
  const io = new Server(server, {
    cors: { origin: config.webOrigin },
    allowRequest: (req, callback) =>
      callback(
        null,
        !req.headers.origin || req.headers.origin === config.webOrigin,
      ),
  });
  async function authorize(token: unknown) {
    if (typeof token !== "string") throw new Error("Login required.");
    const userId = await system.tokenService.verifyAccessToken(token);
    const user = await mongoUserRepository.findById(userId);
    if (!user || !["admin", "staff"].includes(user.role))
      throw new Error("Staff access required.");
    return user;
  }
  io.use(async (socket, next) => {
    try {
      socket.data.user = await authorize(socket.handshake.auth.token);
      next();
    } catch {
      next(new Error("Invalid session or insufficient permissions."));
    }
  });
  io.on("connection", (socket) => {
    socket.join("queue-staff");
    const check = setInterval(() => {
      void authorize(socket.handshake.auth.token).catch(() =>
        socket.disconnect(true),
      );
    }, 30000);
    check.unref();
    socket.on("disconnect", () => clearInterval(check));
  });
  // Only an invalidation is broadcast. Personal data comes from the authorized HTTP query.
  const publish = () => io.to("queue-staff").emit("queue:changed");
  system.events.on("queue:changed", publish);
  return {
    io,
    async close() {
      system.events.off("queue:changed", publish);
      await new Promise<void>((resolve) => io.close(() => resolve()));
    },
  };
}
