import cron from "node-cron";
import type { System } from "../../compositionRoot.js";
import {
  createMailSender,
  createOutboxWorker,
} from "../notifications/OutboxWorker.js";
import { config } from "../config/env.js";
export function startJobs(system: System) {
  const sender = createMailSender(),
    worker = createOutboxWorker(sender);
  if (!sender)
    console.log(
      "Email delivery is disabled; outbox notifications remain pending.",
    );
  const pending = new Set<Promise<unknown>>();
  function run(action: () => Promise<unknown>) {
    const task = action().catch((error) =>
      console.error(
        "Background task failed:",
        error instanceof Error ? error.name : "UnknownError",
      ),
    );
    pending.add(task);
    void task.finally(() => pending.delete(task));
    return task.then(() => {});
  }
  const tasks = [
    cron.schedule("* * * * *", () => run(() => system.booking.markNoShows()), {
      timezone: config.zone,
      noOverlap: true,
    }),
    cron.schedule("*/5 * * * * *", () => run(() => worker.deliver()), {
      noOverlap: true,
    }),
  ];
  return async () => {
    for (const task of tasks) await task.destroy();
    await Promise.allSettled([...pending]);
  };
}
