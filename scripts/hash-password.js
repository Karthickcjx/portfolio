"use strict";

const crypto = require("crypto");
const { hashPassword, isStrongPassword } = require("../src/password");

async function main() {
  const provided = process.argv.slice(2).join(" ");
  const password = provided || crypto.randomBytes(24).toString("base64url");

  if (!isStrongPassword(password)) {
    console.error("Password must be at least 14 characters and include uppercase, lowercase, number, and symbol.");
    process.exitCode = 1;
    return;
  }

  const hash = await hashPassword(password);
  if (!provided) {
    console.log(`Generated password: ${password}`);
  }
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
