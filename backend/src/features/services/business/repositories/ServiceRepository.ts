import type { Service } from "../Service.js";
export interface CreateServiceData {
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  isActive: boolean;
}
export type UpdateServiceData = Omit<CreateServiceData, "isActive">;
export interface ServiceRepository {
  create(data: CreateServiceData): Promise<Service>;
  findById(id: string): Promise<Service | null>;
  findActive(): Promise<Service[]>;
  findAll(): Promise<Service[]>;
  update(id: string, data: UpdateServiceData): Promise<Service | null>;
  setActive(id: string, active: boolean): Promise<Service | null>;
}
