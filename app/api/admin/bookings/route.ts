import { getBookingsPage } from "@/db/salon";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const session = requireAdminSession(request);
  if (session instanceof Response) return session;

  try {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get("page") ?? 1);
    const pageSize = Number(url.searchParams.get("pageSize") ?? 10);
    const date = url.searchParams.get("date")?.trim();
    return Response.json(await getBookingsPage(page, pageSize, date || undefined));
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load bookings" },
      { status: 500 },
    );
  }
}
