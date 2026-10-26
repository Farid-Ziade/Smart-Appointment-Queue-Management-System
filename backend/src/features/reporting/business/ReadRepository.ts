import type { Actor } from "../../booking/use-cases/BookingService.js";
export interface ReadRepository {
  appointments(
    actor: Actor,
    from: Date,
    to: Date,
    search: string,
    page: number,
  ): Promise<unknown>;
  queue(actor: Actor, day: string): Promise<unknown>;
  dashboard(
    from: Date,
    to: Date,
    day: string,
    chartFrom: Date,
    zone: string,
  ): Promise<unknown>;
}
