import type { ServiceRepository } from "../business/repositories/ServiceRepository.js";
import { AppError } from "../../../shared/errors/AppError.js";
import {
  bool,
  id,
  integer,
  record,
  text,
} from "../../../shared/validation/input.js";
export function serviceData(input: unknown) {
  const data = record(input);
  return {
    name: text(data.name, "Name", 120),
    description: text(data.description, "Description", 2000),
    durationMinutes: integer(data.durationMinutes, "Duration", 1, 480),
    priceCents: integer(data.priceCents, "Price in cents", 0, 100000000),
  };
}
export function createServiceCatalog(repository: ServiceRepository) {
  return {
    list: (includeInactive: boolean) =>
      includeInactive ? repository.findAll() : repository.findActive(),
    create: (input: unknown) =>
      repository.create({ ...serviceData(input), isActive: true }),
    async update(serviceId: unknown, input: unknown) {
      const service = await repository.update(
        id(serviceId),
        serviceData(input),
      );
      if (!service) throw new AppError("NOT_FOUND", "Service not found.");
      return service;
    },
    async setActive(serviceId: unknown, input: unknown) {
      const service = await repository.setActive(
        id(serviceId),
        bool(record(input).isActive, "Active"),
      );
      if (!service) throw new AppError("NOT_FOUND", "Service not found.");
      return service;
    },
  };
}
