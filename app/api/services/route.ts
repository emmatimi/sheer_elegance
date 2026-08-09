import { getServices } from "@/db/salon";

export async function GET() {
  try {
    return Response.json({ services: await getServices() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load services" },
      { status: 500 },
    );
  }
}
