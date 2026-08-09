import { getSalonSettings } from "@/db/salon";

export async function GET() {
  try {
    return Response.json({ settings: await getSalonSettings() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load settings" },
      { status: 500 },
    );
  }
}
