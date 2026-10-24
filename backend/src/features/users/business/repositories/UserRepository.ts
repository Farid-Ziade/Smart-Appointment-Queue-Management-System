import type { User, UserRole } from "../User.js";

export interface CreateUserData {
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;

  create(data: CreateUserData): Promise<User>;
}
