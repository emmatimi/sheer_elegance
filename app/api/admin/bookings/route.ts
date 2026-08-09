import { getBookings } from "@/db/salon";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const session = requireAdminSession(request);
  if (session instanceof Response) return session;

  try {
    return Response.json({ bookings: await getBookings() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load bookings" },
      { status: 500 },
    );
  }
}
