import "dotenv/config";
import mongoose from "mongoose";

import { connectDatabase } from "../shared/config/database.js";
import { mongoUserRepository } from "../features/users/database/repositories/MongoUserRepository.js";

async function checkUserRepository() {
  try {
    await connectDatabase();

    const user = await mongoUserRepository.findByEmail(
      "repository-check@example.test",
    );

    if (user === null) {
      console.log("No matching user found.");
    } else {
      console.log("Matching user found.");
    }
  } finally {
    await mongoose.disconnect();
  }
}

checkUserRepository().catch((error) => {
  console.error("Repository check failed:", error);
  process.exitCode = 1;
});
