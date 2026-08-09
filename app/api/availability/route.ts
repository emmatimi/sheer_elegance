import { getBookedTimes } from "@/db/salon";

export async function GET() {
  try {
    return Response.json({ bookedTimes: await getBookedTimes() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load availability" },
      { status: 500 },
    );
  }
}
