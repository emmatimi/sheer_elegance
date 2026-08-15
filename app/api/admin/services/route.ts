import { createService, deleteService, getServices, updateService, type Service } from "@/db/salon";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const session = requireAdminSession(request);
  if (session instanceof Response) return session;

  return noStoreJson({ services: await getServices() });
}

export async function PUT(request: Request) {
  const session = requireAdminSession(request);
  if (session instanceof Response) return session;

  try {
    const payload = await request.json();
    const service = parseService(payload) as Service;
    return noStoreJson({ service: await updateService(service) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save services" },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const session = requireAdminSession(request);
  if (session instanceof Response) return session;

  try {
    const payload = await request.json();
    const service = parseService(payload, { allowNew: true }) as Omit<Service, "id">;
    return noStoreJson({ service: await createService(service) }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to create service" },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = requireAdminSession(request);
  if (session instanceof Response) return session;

  try {
    const url = new URL(request.url);
    const id = Number(url.searchParams.get("id"));
    if (!Number.isInteger(id) || id < 1) throw new Error("Valid service id is required");
    await deleteService(id);
    return noStoreJson({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete service";
    return Response.json(
      { error: message.includes("foreign key") ? "This service already has bookings, so it cannot be deleted. You can rename it or edit it instead." : message },
      { status: 400 },
    );
  }
}

function parseService(payload: unknown, options: { allowNew?: boolean } = {}): Service | Omit<Service, "id"> {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid services request");
  }
  const item = ((payload as Record<string, unknown>).service ?? payload) as Record<string, unknown>;
  const id = Number(item.id);
  const priceNaira = Number(item.priceNaira ?? 0);
  const durationMinutes = Number(item.durationMinutes ?? 0);
  if (!options.allowNew && (!Number.isInteger(id) || id < 1)) throw new Error("Service id is invalid");
  const service = {
    name: requiredString(item.name, "name"),
    category: requiredString(item.name, "name"),
    priceNaira: Number.isInteger(priceNaira) && priceNaira >= 0 ? priceNaira : 0,
    durationMinutes: Number.isInteger(durationMinutes) && durationMinutes >= 0 ? durationMinutes : 0,
    imageUrl: requiredString(item.imageUrl, "imageUrl"),
    shortDescription: requiredString(item.shortDescription, "shortDescription"),
    isFeatured: Boolean(item.isFeatured),
  };
  return options.allowNew ? service : { id, ...service };
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}

function noStoreJson(payload: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return Response.json(payload, { ...init, headers });
}
