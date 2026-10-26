export type QueueStatus =
  "Waiting" | "Called" | "InService" | "Completed" | "Cancelled";
export interface QueueEntry {
  id: string;
  appointmentId: string;
  staffId: string;
  day: string;
  number: number;
  priority: number;
  status: QueueStatus;
  checkedInAt: Date;
  calledAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
