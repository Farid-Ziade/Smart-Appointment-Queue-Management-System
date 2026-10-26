import { EventEmitter } from "node:events";
import { createAuthRouter } from "./features/users/api/authRoutes.js";
import { mongoUserRepository } from "./features/users/database/repositories/MongoUserRepository.js";
import { UserModel } from "./features/users/database/models/UserModel.js";
import { bcryptPasswordHasher } from "./shared/security/BcryptPasswordHasher.js";
import { createJwtTokenService } from "./shared/security/JwtTokenService.js";
import { createRequireAuth } from "./features/users/api/middleware/requireAuth.js";
import { mongoServiceRepository } from "./features/services/database/repositories/MongoServiceRepository.js";
import { ServiceModel } from "./features/services/database/models/ServiceModel.js";
import { createServiceCatalog } from "./features/services/use-cases/ServiceCatalog.js";
import { createServiceRouter } from "./features/services/api/serviceRoutes.js";
import { mongoUnitOfWork } from "./shared/database/MongoUnitOfWork.js";
import { StaffScheduleModel } from "./features/booking/database/models/StaffScheduleModel.js";
import { AppointmentModel } from "./features/booking/database/models/AppointmentModel.js";
import {
  QueueEntryModel,
  QueueCounterModel,
  OperationGuardModel,
} from "./features/queue/database/models/QueueEntryModel.js";
import {
  IdempotencyModel,
  OutboxModel,
  RevokedTokenModel,
} from "./shared/database/TechnicalModels.js";
import { createBookingService } from "./features/booking/use-cases/BookingService.js";
import { createStaffManagement } from "./features/booking/use-cases/StaffManagement.js";
import { createQueueManagement } from "./features/queue/use-cases/QueueManagement.js";
import { createReadService } from "./features/reporting/use-cases/ReadService.js";
import { mongoReadRepository } from "./features/reporting/database/MongoReadRepository.js";
import {
  createBookingRouter,
  createStaffRouter,
} from "./features/booking/api/bookingRoutes.js";
import { createQueueRouter } from "./features/queue/api/queueRoutes.js";
import { config } from "./shared/config/env.js";
export function createSystem(clock = () => new Date()) {
  const events = new EventEmitter();
  const tokenService = createJwtTokenService(process.env.JWT_SECRET ?? "");
  const auth = createRequireAuth(mongoUserRepository, tokenService);
  const booking = createBookingService(mongoUnitOfWork, config, clock);
  const staff = createStaffManagement(
    mongoUnitOfWork,
    bcryptPasswordHasher,
    config.zone,
    clock,
  );
  const queue = createQueueManagement(
    mongoUnitOfWork,
    config.zone,
    config.graceMinutes,
    clock,
  );
  const reads = createReadService(mongoReadRepository, config.zone, clock);
  const changed = () => events.emit("queue:changed");
  return {
    events,
    tokenService,
    booking,
    queue,
    staff,
    reads,
    auth,
    authRouter: createAuthRouter(
      mongoUserRepository,
      bcryptPasswordHasher,
      tokenService,
    ),
    serviceRouter: createServiceRouter(
      createServiceCatalog(mongoServiceRepository),
      auth,
    ),
    staffRouter: createStaffRouter(staff, auth),
    bookingRouter: createBookingRouter(booking, reads, auth, changed),
    queueRouter: createQueueRouter(queue, reads, auth, changed),
  };
}
export type System = ReturnType<typeof createSystem>;
export async function initializeStorage() {
  for (const model of [
    UserModel,
    ServiceModel,
    StaffScheduleModel,
    AppointmentModel,
    QueueEntryModel,
    QueueCounterModel,
    OperationGuardModel,
    IdempotencyModel,
    OutboxModel,
    RevokedTokenModel,
  ])
    await model.init();
  await OperationGuardModel.updateOne(
    { _id: "queue" },
    { $setOnInsert: { version: 0 } },
    { upsert: true },
  );
}
