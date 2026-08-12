import mysql, { type Connection, type RowDataPacket } from "mysql2/promise";
import { env } from "cloudflare:workers";

type HyperdriveBinding = {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
};

type DbConnectionMode = "hyperdrive" | "direct";

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
  const hyperdrive = getHyperdriveBinding();
  if (hyperdrive) {
    return mysql.createConnection({
      host: hyperdrive.host,
      port: hyperdrive.port,
      database: hyperdrive.database,
      user: hyperdrive.user,
      password: hyperdrive.password,
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

export function getDbRuntimeInfo() {
  const hyperdrive = getHyperdriveBinding();
  const host = process.env.MYSQL_HOST;
  const mode: DbConnectionMode = hyperdrive ? "hyperdrive" : "direct";

  return {
    mode,
    hasHyperdriveBinding: Boolean(hyperdrive),
    hyperdriveHostPresent: Boolean(hyperdrive?.host),
    hyperdrivePortPresent: Boolean(hyperdrive?.port),
    hyperdriveDatabasePresent: Boolean(hyperdrive?.database),
    mysqlHostPresent: Boolean(host),
    mysqlHostSuffix: host ? host.split(".").slice(-3).join(".") : null,
    mysqlPort: Number(process.env.MYSQL_PORT ?? 3306),
    adminSecretPresent: Boolean(process.env.ADMIN_SESSION_SECRET),
  };
}

export async function testDbConnection() {
  const startedAt = Date.now();
  try {
    const rows = await queryRows<RowDataPacket & { ok: number }>("SELECT 1 AS ok");
    return {
      ok: true,
      elapsedMs: Date.now() - startedAt,
      runtime: getDbRuntimeInfo(),
      result: rows[0]?.ok,
    };
  } catch (error) {
    return {
      ok: false,
      elapsedMs: Date.now() - startedAt,
      runtime: getDbRuntimeInfo(),
      error: normalizeDbError(error),
    };
  }
}

function getHyperdriveBinding() {
  return (env as { HYPERDRIVE?: HyperdriveBinding }).HYPERDRIVE;
}

function normalizeDbError(error: unknown) {
  const dbError = error as Error & {
    code?: string;
    errno?: number;
    sqlState?: string;
    syscall?: string;
    address?: string;
    port?: number;
  };

  return {
    message: dbError?.message ?? "Unknown database error",
    code: dbError?.code ?? null,
    errno: dbError?.errno ?? null,
    sqlState: dbError?.sqlState ?? null,
    syscall: dbError?.syscall ?? null,
    address: dbError?.address ? redactAddress(dbError.address) : null,
    port: dbError?.port ?? null,
  };
}

function redactAddress(address: string) {
  if (/^\d+\.\d+\.\d+\.\d+$/.test(address)) return "redacted-ipv4";
  return address.split(".").slice(-3).join(".");
}

export async function queryRows<T extends RowDataPacket>(
  sql: string,
  values: unknown[] = [],
) {
  return withDbConnection(async (connection) => {
    const [rows] = await connection.query<T[]>(sql, values);
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
