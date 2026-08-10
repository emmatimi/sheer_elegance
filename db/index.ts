import mysql, { type Connection, type RowDataPacket } from "mysql2/promise";

type RequiredEnv =
  | "MYSQL_HOST"
  | "MYSQL_DATABASE"
  | "MYSQL_USER"
  | "MYSQL_PASSWORD"
  | "ADMIN_SESSION_SECRET";

const requiredEnv: RequiredEnv[] = [
  "MYSQL_HOST",
  "MYSQL_DATABASE",
  "MYSQL_USER",
  "MYSQL_PASSWORD",
  "ADMIN_SESSION_SECRET",
];

function getEnv(name: RequiredEnv) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export async function createDbConnection() {
  // If Cloudflare Hyperdrive is bound, use its connection string!
  // This completely bypasses the Cloudflare STARTTLS limitation.
  const hyperdrive = (process.env as any).HYPERDRIVE;
  if (hyperdrive && hyperdrive.connectionString) {
    return mysql.createConnection({
      uri: hyperdrive.connectionString,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0,
      disableEval: true,
    });
  }

  for (const name of requiredEnv) {
    getEnv(name);
  }

  return mysql.createConnection({
    host: getEnv("MYSQL_HOST"),
    port: Number(process.env.MYSQL_PORT ?? 3306),
    database: getEnv("MYSQL_DATABASE"),
    user: getEnv("MYSQL_USER"),
    password: getEnv("MYSQL_PASSWORD"),
    ssl: getEnv("MYSQL_HOST").includes("localhost") || getEnv("MYSQL_HOST").includes("127.0.0.1") ? undefined : {},
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    disableEval: true,
  });
}

export async function queryRows<T extends RowDataPacket>(
  sql: string,
  values: unknown[] = [],
) {
  return withDbConnection(async (connection) => {
    const [rows] = await connection.execute<T[]>(sql, values);
    return rows;
  });
}

export async function withDbConnection<T>(
  callback: (connection: Connection) => Promise<T>,
) {
  const connection = await createDbConnection();
  try {
    return await callback(connection);
  } finally {
    await connection.end();
  }
}
