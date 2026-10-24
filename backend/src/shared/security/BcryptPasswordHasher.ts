import bcrypt from "bcrypt";
import type { PasswordHasher } from "./PasswordHasher.js";

const HASH_COST = 12;

export const bcryptPasswordHasher: PasswordHasher = {
  async hash(password: string): Promise<string> {
    if (Buffer.byteLength(password, "utf8") > 72) {
      throw new Error("Password must not exceed 72 UTF-8 bytes.");
    }

    return bcrypt.hash(password, HASH_COST);
  },

  async compare(password: string, passwordHash: string): Promise<boolean> {
    if (Buffer.byteLength(password, "utf8") > 72) {
      return false;
    }

    return bcrypt.compare(password, passwordHash);
  },
};
