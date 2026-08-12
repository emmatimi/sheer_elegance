import { testDbConnection } from "@/db";

export async function GET(request: Request) {
  const token = process.env.DB_DIAGNOSTIC_TOKEN;
  if (!token) {
    return Response.json(
      { error: "Set DB_DIAGNOSTIC_TOKEN before using this endpoint." },
      { status: 404 },
    );
  }

  const url = new URL(request.url);
  const providedToken =
    request.headers.get("x-diagnostic-token") ??
    url.searchParams.get("token");

  if (providedToken !== token) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(await testDbConnection());
}
