export interface WorkingInterval {
  weekday: number;
  startMinute: number;
  endMinute: number;
}
export interface ScheduleData {
  serviceIds: string[];
  weekly: WorkingInterval[];
  daysOff: string[];
}
export interface StaffSchedule extends ScheduleData {
  id: string;
  staffId: string;
  bookingVersion: number;
  createdAt: Date;
  updatedAt: Date;
}
