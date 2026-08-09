import { randomBytes, scryptSync } from "node:crypto";
import { stdin as input, stdout as output } from "node:process";
import readline from "node:readline/promises";

const password = process.argv[2] ?? await promptPassword();
if (!password || password.length < 12) {
  throw new Error("Use an admin password with at least 12 characters.");
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
console.log(`scrypt:${salt}:${hash}`);

async function promptPassword() {
  const rl = readline.createInterface({ input, output });
  try {
    return await rl.question("Admin password: ");
  } finally {
    rl.close();
  }
}
