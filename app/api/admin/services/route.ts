import { getServices, saveServices, type Service } from "@/db/salon";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const session = requireAdminSession(request);
  if (session instanceof Response) return session;

  return Response.json({ services: await getServices() });
}

export async function PUT(request: Request) {
  const session = requireAdminSession(request);
  if (session instanceof Response) return session;

  try {
    const payload = await request.json();
    const services = parseServices(payload);
    await saveServices(services);
    return Response.json({ services: await getServices() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save services" },
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
    const priceNaira = Number(item.priceNaira);
    const durationMinutes = Number(item.durationMinutes);
    const sortOrder = Number(item.sortOrder);

    if (!Number.isInteger(id) || id < 1) throw new Error("Service id is invalid");
    if (!Number.isInteger(priceNaira) || priceNaira < 0) {
      throw new Error("Service price must be a whole number");
    }
    if (!Number.isInteger(durationMinutes) || durationMinutes < 0) {
      throw new Error("Service duration must be a whole number");
    }

    return {
      id,
      name: requiredString(item.name, "name"),
      slug: requiredString(item.slug, "slug"),
      category: requiredString(item.category, "category"),
      priceNaira,
      durationMinutes,
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
