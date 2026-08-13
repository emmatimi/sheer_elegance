import { getHairstyles } from "@/db/salon";

export async function GET() {
  try {
    return noStoreJson({ hairstyles: await getHairstyles() });
  } catch (error) {
    return noStoreJson(
      { error: error instanceof Error ? error.message : "Unable to load hairstyles" },
      { status: 500 },
    );
  }
}

function noStoreJson(payload: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return Response.json(payload, { ...init, headers });
}
