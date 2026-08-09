import { randomBytes, scryptSync } from "node:crypto";
import mysql from "mysql2/promise";

const [email, password, name = "Owner", role = "owner"] = process.argv.slice(2);

if (!email || !password) {
  throw new Error('Usage: npm run admin:seed -- "admin@example.com" "long-password"');
}

if (password.length < 12) {
  throw new Error("Use an admin password with at least 12 characters.");
}

const required = [
  "MYSQL_HOST",
  "MYSQL_DATABASE",
  "MYSQL_USER",
  "MYSQL_PASSWORD",
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const salt = randomBytes(16).toString("hex");
const passwordHash = `scrypt:${salt}:${scryptSync(password, salt, 64).toString("hex")}`;

const connection = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT ?? 3306),
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  disableEval: true,
});

try {
  await connection.execute(
    `INSERT INTO admins (name, email, password_hash, role)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       name = VALUES(name),
       password_hash = VALUES(password_hash),
       role = VALUES(role)`,
    [name, email, passwordHash, role],
  );
  console.log(`Admin seeded: ${email}`);
} finally {
  await connection.end();
}
