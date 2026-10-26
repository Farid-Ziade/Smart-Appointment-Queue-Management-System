import { Router, type RequestHandler } from "express";
import type { createQueueManagement } from "../use-cases/QueueManagement.js";
import type { createReadService } from "../../reporting/use-cases/ReadService.js";
import { requireRole } from "../../users/api/middleware/requireRole.js";
export function createQueueRouter(
  queue: ReturnType<typeof createQueueManagement>,
  reads: ReturnType<typeof createReadService>,
  auth: RequestHandler,
  changed: () => void,
) {
  const router = Router();
  router.use(auth, requireRole("admin", "staff"));
  router.get("/", async (_req, res) =>
    res.json(await reads.queue(res.locals.user)),
  );
  router.post("/check-in", async (req, res) => {
    const entry = await queue.checkIn(res.locals.user, req.body);
    changed();
    res.status(201).json({ entry });
  });
  router.post("/call-next", async (req, res) => {
    const entry = await queue.callNext(res.locals.user, req.body);
    changed();
    res.json({ entry });
  });
  router.patch("/:id/start", async (req, res) => {
    const entry = await queue.transition(
      res.locals.user,
      req.params.id,
      "start",
    );
    changed();
    res.json({ entry });
  });
  router.patch("/:id/complete", async (req, res) => {
    const entry = await queue.transition(
      res.locals.user,
      req.params.id,
      "complete",
    );
    changed();
    res.json({ entry });
  });
  router.patch("/:id/priority", requireRole("admin"), async (req, res) => {
    const entry = await queue.prioritize(
      res.locals.user,
      req.params.id,
      req.body,
    );
    changed();
    res.json({ entry });
  });
  return router;
}
