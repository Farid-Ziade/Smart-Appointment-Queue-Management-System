export type UserRole = "admin" | "staff" | "customer";

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserProfile = Omit<User, "passwordHash">;
