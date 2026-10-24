import type { UserRepository } from "../../business/repositories/UserRepository.js";
import { UserModel } from "../models/UserModel.js";
import { AppError } from "../../../../shared/errors/AppError.js";
import type { User, UserProfile } from "../../business/User.js";
import { isObjectIdOrHexString } from "mongoose";

export const mongoUserRepository: UserRepository = {
  async findByEmail(email) {
    const user = await UserModel.findOne({
      email: email.trim().toLowerCase(),
    })
      .select("+passwordHash")
      .exec();

    if (user === null) {
      return null;
    }

    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      passwordHash: user.passwordHash,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
  async findById(id: string): Promise<UserProfile | null> {
    if (!isObjectIdOrHexString(id)) {
      return null;
    }

    const user = await UserModel.findById(id).exec();

    if (user === null) {
      return null;
    }

    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },

  async create(data) {
    const user = await UserModel.create(data).catch((error: unknown) => {
      if (error instanceof Error && "code" in error && error.code === 11000) {
        throw new AppError("EMAIL_IN_USE", "This email is already registered.");
      }

      throw error;
    });

    return {
      id: user._id.toString(),
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      passwordHash: user.passwordHash,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },
};
