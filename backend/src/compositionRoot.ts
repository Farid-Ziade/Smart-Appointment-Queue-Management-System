import { createAuthRouter } from "./features/users/api/authRoutes.js";
import { mongoUserRepository } from "./features/users/database/repositories/MongoUserRepository.js";
import { UserModel } from "./features/users/database/models/UserModel.js";
import { bcryptPasswordHasher } from "./shared/security/BcryptPasswordHasher.js";
import { createJwtTokenService } from "./shared/security/JwtTokenService.js";

const tokenService = createJwtTokenService(process.env.JWT_SECRET ?? "");

export const authRouter = createAuthRouter(
  mongoUserRepository,
  bcryptPasswordHasher,
  tokenService,
);

export async function initializeUserStorage() {
  await UserModel.init();
}
