import type {
  ClientSession,
  HydratedDocument,
  InferSchemaType,
} from "mongoose";
import type { Service } from "../../business/Service.js";
import type { ServiceRepository } from "../../business/repositories/ServiceRepository.js";
import { ServiceModel, serviceSchema } from "../models/ServiceModel.js";
export function mapService(
  doc: HydratedDocument<InferSchemaType<typeof serviceSchema>>,
): Service {
  return {
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description,
    durationMinutes: doc.durationMinutes,
    priceCents: doc.priceCents,
    isActive: doc.isActive,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}
export function createMongoServiceRepository(
  session?: ClientSession,
): ServiceRepository {
  return {
    async create(data) {
      const [doc] = await ServiceModel.create([data], { session });
      return mapService(doc!);
    },
    async findById(id) {
      const doc = await ServiceModel.findById(id).session(session ?? null);
      return doc ? mapService(doc) : null;
    },
    async findActive() {
      return (
        await ServiceModel.find({ isActive: true })
          .sort({ name: 1, _id: 1 })
          .session(session ?? null)
      ).map(mapService);
    },
    async findAll() {
      return (
        await ServiceModel.find()
          .sort({ name: 1, _id: 1 })
          .session(session ?? null)
      ).map(mapService);
    },
    async update(id, data) {
      const doc = await ServiceModel.findByIdAndUpdate(
        id,
        { $set: data, $inc: { bookingVersion: 1 } },
        { returnDocument: "after", runValidators: true, session },
      );
      return doc ? mapService(doc) : null;
    },
    async setActive(id, isActive) {
      const doc = await ServiceModel.findByIdAndUpdate(
        id,
        { $set: { isActive }, $inc: { bookingVersion: 1 } },
        { returnDocument: "after", runValidators: true, session },
      );
      return doc ? mapService(doc) : null;
    },
  };
}
export const mongoServiceRepository = createMongoServiceRepository();
