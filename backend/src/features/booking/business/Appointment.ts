export const appointmentStatuses = [
  "Pending",
  "Confirmed",
  "CheckedIn",
  "InService",
  "Completed",
  "Cancelled",
  "NoShow",
] as const;
export type AppointmentStatus = (typeof appointmentStatuses)[number];
export const blockingStatuses: AppointmentStatus[] = [
  "Pending",
  "Confirmed",
  "CheckedIn",
  "InService",
  "Completed",
];
export interface Appointment {
  id: string;
  reference: string;
  customerId: string;
  serviceId: string;
  staffId: string;
  startAt: Date;
  endAt: Date;
  status: AppointmentStatus;
  serviceName: string;
  priceCents: number;
  durationMinutes: number;
  revision: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
export type NewAppointment = Omit<
  Appointment,
  "id" | "createdAt" | "updatedAt"
>;
