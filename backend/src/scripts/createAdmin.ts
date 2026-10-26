import "dotenv/config";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import mongoose from "mongoose";
import { connectDatabase } from "../shared/config/database.js";
import { UserModel } from "../features/users/database/models/UserModel.js";
import { bcryptPasswordHasher } from "../shared/security/BcryptPasswordHasher.js";
import { text } from "../shared/validation/input.js";
const prompt = createInterface({ input: stdin, output: stdout });
try {
  const fullName = text(
    await prompt.question("Admin full name: "),
    "Full name",
  );
  const email = text(
    await prompt.question("Admin email: "),
    "Email",
  ).toLowerCase();
  const phone = text(await prompt.question("Admin phone: "), "Phone");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error("Invalid email.");
  // Environment input avoids echoing the password in the terminal or storing it in code.
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72)
    throw new Error(
      "Set ADMIN_PASSWORD to a password of at least 8 characters and at most 72 UTF-8 bytes.",
    );
  await connectDatabase();
  await UserModel.init();
  if (await UserModel.exists({ email }))
    throw new Error(
      "This email already exists; this command does not promote existing accounts.",
    );
  await UserModel.create({
    fullName,
    email,
    phone,
    passwordHash: await bcryptPasswordHasher.hash(password),
    role: "admin",
  });
  console.log("Administrator created. You can now log in.");
} catch (error) {
  console.error(
    error instanceof Error ? error.message : "Admin creation failed.",
  );
  process.exitCode = 1;
} finally {
  prompt.close();
  await mongoose.disconnect();
}
