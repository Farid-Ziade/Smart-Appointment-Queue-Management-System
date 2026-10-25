import type { Service } from "../Service.js";

export interface CreateServiceData {
  name: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  isActive: boolean;
}

export interface ServiceRepository {
  create(data: CreateServiceData): Promise<Service>;

  findById(id: string): Promise<Service | null>;

  findActive(): Promise<Service[]>;
}
