import { deleteService, getServices, saveServices, type Service } from "@/db/salon";
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
    const services = parseServices(payload);
    await saveServices(services);
    return noStoreJson({ services: await getServices() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save services" },
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
    return noStoreJson({ services: await getServices() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to delete service";
    return Response.json(
      { error: message.includes("foreign key") ? "This service already has bookings, so it cannot be deleted. You can rename it or edit it instead." : message },
      { status: 400 },
    );
  }
}

function parseServices(payload: unknown): Service[] {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid services request");
  }
  const services = (payload as Record<string, unknown>).services;
  if (!Array.isArray(services)) throw new Error("services must be an array");

  return services.map((service, index) => {
    if (!service || typeof service !== "object") {
      throw new Error(`Service ${index + 1} is invalid`);
    }
    const item = service as Record<string, unknown>;
    const id = Number(item.id);
    const priceNaira = Number(item.priceNaira ?? 0);
    const durationMinutes = Number(item.durationMinutes ?? 0);
    const sortOrder = Number(item.sortOrder);

    if (!Number.isInteger(id)) throw new Error("Service id is invalid");
    return {
      id,
      name: requiredString(item.name, "name"),
      slug: requiredString(item.slug, "slug"),
      category: typeof item.category === "string" && item.category.trim() ? item.category.trim() : requiredString(item.name, "name"),
      priceNaira: Number.isInteger(priceNaira) && priceNaira >= 0 ? priceNaira : 0,
      durationMinutes: Number.isInteger(durationMinutes) && durationMinutes >= 0 ? durationMinutes : 0,
      imageUrl: requiredString(item.imageUrl, "imageUrl"),
      shortDescription: requiredString(item.shortDescription, "shortDescription"),
      isFeatured: Boolean(item.isFeatured),
      sortOrder: Number.isInteger(sortOrder) ? sortOrder : index + 1,
    };
  });
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
