import { getHairstyles } from "@/db/salon";

export async function GET() {
  try {
    return Response.json({ hairstyles: await getHairstyles() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to load hairstyles" },
      { status: 500 },
    );
  }
}
