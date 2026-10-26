import { Router, type RequestHandler } from "express";
import type { createBookingService } from "../use-cases/BookingService.js";
import type { createStaffManagement } from "../use-cases/StaffManagement.js";
import type { createReadService } from "../../reporting/use-cases/ReadService.js";
import { requireRole } from "../../users/api/middleware/requireRole.js";
export function createBookingRouter(
  booking: ReturnType<typeof createBookingService>,
  reads: ReturnType<typeof createReadService>,
  auth: RequestHandler,
  changed: () => void,
) {
  const router = Router();
  router.use(auth);
  router.get("/availability", async (req, res) =>
    res.json(await booking.availability(res.locals.user, req.query)),
  );
  router.get("/appointments", async (req, res) =>
    res.json(await reads.appointments(res.locals.user, req.query)),
  );
  router.post("/appointments", requireRole("customer"), async (req, res) =>
    res
      .status(201)
      .json({
        appointment: await booking.book(
          res.locals.user,
          req.body,
          req.get("Idempotency-Key"),
        ),
      }),
  );
  router.get("/appointments/:id", async (req, res) =>
    res.json({
      appointment: await booking.get(res.locals.user, req.params.id),
    }),
  );
  router.patch("/appointments/:id/reschedule", async (req, res) => {
    const appointment = await booking.reschedule(
      res.locals.user,
      req.params.id,
      req.body,
    );
    changed();
    res.json({ appointment });
  });
  router.patch(
    "/appointments/:id/confirm",
    requireRole("admin", "staff"),
    async (req, res) =>
      res.json({
        appointment: await booking.confirm(res.locals.user, req.params.id),
      }),
  );
  router.patch("/appointments/:id/cancel", async (req, res) => {
    const appointment = await booking.cancel(res.locals.user, req.params.id);
    changed();
    res.json({ appointment });
  });
  return router;
}
export function createStaffRouter(
  staff: ReturnType<typeof createStaffManagement>,
  auth: RequestHandler,
) {
  const router = Router();
  router.use(auth);
  router.get("/", async (req, res) => {
    const employees = await staff.list(req.query.serviceId);
    res.json({
      staff:
        res.locals.user.role === "admin"
          ? employees
          : employees.map((employee) => ({
              id: employee.id,
              fullName: employee.fullName,
              serviceIds: employee.schedule?.serviceIds ?? [],
            })),
    });
  });
  router.post("/", requireRole("admin"), async (req, res) =>
    res
      .status(201)
      .json({ user: await staff.create(res.locals.user, req.body) }),
  );
  router.put("/:id/schedule", requireRole("admin"), async (req, res) =>
    res.json({
      schedule: await staff.updateSchedule(
        res.locals.user,
        req.params.id,
        req.body,
      ),
    }),
  );
  return router;
}
