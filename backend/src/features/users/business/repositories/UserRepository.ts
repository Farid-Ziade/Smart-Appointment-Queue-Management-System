import type { User, UserProfile, UserRole } from "../User.js";
export interface CreateUserData {
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: UserRole;
}

export interface UserRepository {
  findByEmail(email: string): Promise<User | null>;

  findById(id: string): Promise<UserProfile | null>;

  create(data: CreateUserData): Promise<User>;
}
