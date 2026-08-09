import { getSalonSettings, saveSalonSettings, type SalonSettings } from "@/db/salon";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const session = requireAdminSession(request);
  if (session instanceof Response) return session;

  return Response.json({ settings: await getSalonSettings() });
}

export async function PUT(request: Request) {
  const session = requireAdminSession(request);
  if (session instanceof Response) return session;

  try {
    const payload = await request.json();
    const settings = parseSettings(payload);
    await saveSalonSettings(settings);
    return Response.json({ settings: await getSalonSettings() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save settings" },
      { status: 400 },
    );
  }
}

function parseSettings(payload: unknown): SalonSettings {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid settings request");
  }
  const settings = (payload as Record<string, unknown>).settings;
  if (!settings || typeof settings !== "object") {
    throw new Error("settings is required");
  }
  const data = settings as Record<string, unknown>;

  return {
    studioAddress: requiredString(data.studioAddress, "studioAddress"),
    phone: requiredString(data.phone, "phone"),
    email: requiredString(data.email, "email"),
    openingHours: requiredString(data.openingHours, "openingHours"),
  };
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}
