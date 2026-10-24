import { createAuthRouter } from "./features/users/api/authRoutes.js";
import { mongoUserRepository } from "./features/users/database/repositories/MongoUserRepository.js";
import { UserModel } from "./features/users/database/models/UserModel.js";
import { bcryptPasswordHasher } from "./shared/security/BcryptPasswordHasher.js";

export const authRouter = createAuthRouter(
  mongoUserRepository,
  bcryptPasswordHasher,
);

export async function initializeUserStorage() {
  await UserModel.init();
}
