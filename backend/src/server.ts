import "dotenv/config";
import { createServer } from "node:http";
import mongoose from "mongoose";
import { createApp } from "./app.js";
import { createSystem, initializeStorage } from "./compositionRoot.js";
import { connectDatabase } from "./shared/config/database.js";
import { config } from "./shared/config/env.js";
import { attachQueueSocket } from "./shared/realtime/queueSocket.js";
import { startJobs } from "./shared/jobs/startJobs.js";
async function start() {
  await connectDatabase();
  const topology = await mongoose.connection.db!.admin().command({ hello: 1 });
  if (!topology.setName && topology.msg !== "isdbgrid")
    throw new Error(
      "Use MongoDB Atlas or a replica set; transactions are required.",
    );
  await initializeStorage();
  const system = createSystem(),
    server = createServer(createApp(system));
  const sockets = attachQueueSocket(server, system),
    stopJobs = startJobs(system);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(config.port, resolve);
  });
  console.log(
    `Server running at http://localhost:${config.port}; business timezone: ${config.zone}`,
  );
  let stopping = false;
  async function stop() {
    if (stopping) return;
    stopping = true;
    await stopJobs();
    await sockets.close();
    if (server.listening)
      await new Promise<void>((resolve) => server.close(() => resolve()));
    await mongoose.disconnect();
  }
  process.once("SIGINT", () => {
    void stop();
  });
  process.once("SIGTERM", () => {
    void stop();
  });
}
start().catch(async (error) => {
  console.error(
    "Startup failed:",
    error instanceof Error ? error.message : "Unknown error",
  );
  await mongoose.disconnect();
  // Startup is fatal: also stop any scheduler handles created before listen failed.
  process.exit(1);
});
