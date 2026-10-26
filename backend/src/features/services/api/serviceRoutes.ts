import { Router, type RequestHandler } from "express";
import { requireRole } from "../../users/api/middleware/requireRole.js";
import type { createServiceCatalog } from "../use-cases/ServiceCatalog.js";
export function createServiceRouter(
  catalog: ReturnType<typeof createServiceCatalog>,
  auth: RequestHandler,
) {
  const router = Router();
  router.use(auth);
  router.get("/", async (req, res) => {
    const includeInactive =
      req.query.includeInactive === "true" && res.locals.user.role === "admin";
    res.json({ services: await catalog.list(includeInactive) });
  });
  router.post("/", requireRole("admin"), async (req, res) =>
    res.status(201).json({ service: await catalog.create(req.body) }),
  );
  router.put("/:id", requireRole("admin"), async (req, res) =>
    res.json({ service: await catalog.update(req.params.id, req.body) }),
  );
  router.patch("/:id/active", requireRole("admin"), async (req, res) =>
    res.json({ service: await catalog.setActive(req.params.id, req.body) }),
  );
  return router;
}
