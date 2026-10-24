import assert from "node:assert/strict";
import { bcryptPasswordHasher } from "../shared/security/BcryptPasswordHasher.js";

async function checkPasswordHasher() {
  const password = "Learning123!";

  const passwordHash = await bcryptPasswordHasher.hash(password);

  assert.notEqual(passwordHash, password);

  const correctPasswordMatches = await bcryptPasswordHasher.compare(
    password,
    passwordHash,
  );

  assert.equal(correctPasswordMatches, true);

  const wrongPasswordMatches = await bcryptPasswordHasher.compare(
    "WrongPassword123!",
    passwordHash,
  );

  assert.equal(wrongPasswordMatches, false);

  console.log("Basic password checks passed.");

  const maximumPassword = "a".repeat(72);
  const maximumHash = await bcryptPasswordHasher.hash(maximumPassword);

  assert.equal(
    await bcryptPasswordHasher.compare(maximumPassword, maximumHash),
    true,
  );

  const oversizedPassword = maximumPassword + "b";

  await assert.rejects(() => bcryptPasswordHasher.hash(oversizedPassword));

  assert.equal(
    await bcryptPasswordHasher.compare(oversizedPassword, maximumHash),
    false,
  );

  console.log("Password length checks passed.");
}

checkPasswordHasher().catch((error) => {
  console.error("Password check failed:", error);
  process.exitCode = 1;
});
