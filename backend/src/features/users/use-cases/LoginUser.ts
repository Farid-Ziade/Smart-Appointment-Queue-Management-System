import type { User } from "../business/User.js";
import type { UserRepository } from "../business/repositories/UserRepository.js";
import type { PasswordHasher } from "../../../shared/security/PasswordHasher.js";
import type { TokenService } from "../../../shared/security/TokenService.js";

import { AppError } from "../../../shared/errors/AppError.js";

interface LoginUserData {
  email: string;
  password: string;
}

interface LoginUserResult {
  accessToken: string;
  user: Omit<User, "passwordHash">;
}

export async function loginUser(
  data: LoginUserData,
  userRepository: UserRepository,
  passwordHasher: PasswordHasher,
  tokenService: TokenService,
): Promise<LoginUserResult> {
  const email = data.email.trim().toLowerCase();

  if (!email || !data.password) {
    throw new AppError("INVALID_INPUT", "Email and password are required.");
  }

  const user = await userRepository.findByEmail(email);

  if (user === null) {
    throw new AppError("UNAUTHORIZED", "Incorrect email or password.");
  }

  const passwordMatches = await passwordHasher.compare(
    data.password,
    user.passwordHash,
  );

  if (!passwordMatches) {
    throw new AppError("UNAUTHORIZED", "Incorrect email or password.");
  }

  const accessToken = await tokenService.createAccessToken(user.id);

  return {
    accessToken,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  };
}
