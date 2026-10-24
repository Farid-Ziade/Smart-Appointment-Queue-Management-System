import type { User } from "../business/User.js";
import type { UserRepository } from "../business/repositories/UserRepository.js";
import type { PasswordHasher } from "../../../shared/security/PasswordHasher.js";
import { AppError } from "../../../shared/errors/AppError.js";

interface RegisterUserData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}

export async function registerUser(
  data: RegisterUserData,
  userRepository: UserRepository,
  passwordHasher: PasswordHasher,
): Promise<Omit<User, "passwordHash">> {
  const fullName = data.fullName.trim();
  const email = data.email.trim().toLowerCase();
  const phone = data.phone.trim();

  if (!fullName || !email || !phone) {
    throw new AppError(
      "INVALID_INPUT",
      "Full name, email, and phone are required.",
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AppError(
      "INVALID_INPUT",
      "Please provide a valid email address.",
    );
  }

  if (data.password.length < 8) {
    throw new AppError("EMAIL_IN_USE", "This email is already registered.");
  }

  if (Buffer.byteLength(data.password, "utf8") > 72) {
    throw new AppError(
      "INVALID_INPUT",
      "Password must not exceed 72 UTF-8 bytes.",
    );
  }

  const existingUser = await userRepository.findByEmail(email);

  if (existingUser !== null) {
    throw new AppError("EMAIL_IN_USE", "This email is already registered.");
  }

  const passwordHash = await passwordHasher.hash(data.password);

  const user = await userRepository.create({
    fullName,
    email,
    phone,
    passwordHash,
    role: "customer",
  });

  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
