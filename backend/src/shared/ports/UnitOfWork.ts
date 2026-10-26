import type { ServiceRepository } from "../../features/services/business/repositories/ServiceRepository.js";
import type { Service } from "../../features/services/business/Service.js";
import type { UserRepository } from "../../features/users/business/repositories/UserRepository.js";
import type { UserProfile } from "../../features/users/business/User.js";
import type {
  Appointment,
  NewAppointment,
} from "../../features/booking/business/Appointment.js";
import type {
  ScheduleData,
  StaffSchedule,
} from "../../features/booking/business/StaffSchedule.js";
import type { QueueEntry } from "../../features/queue/business/QueueEntry.js";
export interface EventData {
  key: string;
  to: string;
  subject: string;
  text: string;
}
export interface Store {
  services: ServiceRepository;
  users: UserRepository;
  staffUsers(): Promise<UserProfile[]>;
  lockCustomer(id: string): Promise<void>;
  lockService(id: string): Promise<Service | null>;
  lockQueue(): Promise<void>;
  schedules: {
    get(staffId: string): Promise<StaffSchedule | null>;
    create(staffId: string): Promise<StaffSchedule>;
    lock(staffId: string): Promise<StaffSchedule | null>;
    update(staffId: string, data: ScheduleData): Promise<StaffSchedule | null>;
  };
  appointments: {
    get(id: string): Promise<Appointment | null>;
    byReference(reference: string): Promise<Appointment | null>;
    create(data: NewAppointment): Promise<Appointment>;
    update(id: string, data: Partial<NewAppointment>): Promise<Appointment>;
    overlaps(
      staffId: string,
      start: Date,
      end: Date,
      excludeId?: string,
    ): Promise<boolean>;
    forStaff(staffId: string, from: Date): Promise<Appointment[]>;
    noShowCandidates(cutoff: Date): Promise<Appointment[]>;
  };
  queue: {
    get(id: string): Promise<QueueEntry | null>;
    byAppointment(id: string): Promise<QueueEntry | null>;
    create(
      data: Omit<QueueEntry, "id" | "createdAt" | "updatedAt">,
    ): Promise<QueueEntry>;
    update(id: string, data: Partial<QueueEntry>): Promise<QueueEntry>;
    waiting(day: string, staffId: string): Promise<QueueEntry | null>;
    busy(day: string, staffId: string): Promise<boolean>;
    nextNumber(day: string): Promise<number>;
  };
  replay: {
    get(
      customerId: string,
      key: string,
    ): Promise<{ fingerprint: string; result: Appointment } | null>;
    save(
      customerId: string,
      key: string,
      fingerprint: string,
      result: Appointment,
    ): Promise<void>;
  };
  outbox: { add(event: EventData): Promise<void> };
}
export interface UnitOfWork {
  read: Store;
  run<T>(work: (store: Store) => Promise<T>): Promise<T>;
}
