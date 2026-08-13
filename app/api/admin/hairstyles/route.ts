import { deleteHairstyle, getHairstyles, saveHairstyles, type Hairstyle } from "@/db/salon";
import { requireAdminSession } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const session = requireAdminSession(request);
  if (session instanceof Response) return session;
  return noStoreJson({ hairstyles: await getHairstyles() });
}

export async function PUT(request: Request) {
  const session = requireAdminSession(request);
  if (session instanceof Response) return session;

  try {
    const payload = await request.json();
    const hairstyles = parseHairstyles(payload);
    await saveHairstyles(hairstyles);
    return noStoreJson({ hairstyles: await getHairstyles() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save hairstyles" },
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
    if (!Number.isInteger(id) || id < 1) throw new Error("Valid hairstyle id is required");
    await deleteHairstyle(id);
    return noStoreJson({ hairstyles: await getHairstyles() });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to delete hairstyle" },
      { status: 400 },
    );
  }
}

function parseHairstyles(payload: unknown): Hairstyle[] {
  if (!payload || typeof payload !== "object") throw new Error("Invalid hairstyles request");
  const hairstyles = (payload as Record<string, unknown>).hairstyles;
  if (!Array.isArray(hairstyles)) throw new Error("hairstyles must be an array");

  return hairstyles.map((hairstyle, index) => {
    if (!hairstyle || typeof hairstyle !== "object") throw new Error(`Hairstyle ${index + 1} is invalid`);
    const item = hairstyle as Record<string, unknown>;
    const id = Number(item.id);
    const sortOrder = Number(item.sortOrder);
    if (!Number.isInteger(id)) throw new Error("Hairstyle id is invalid");

    return {
      id,
      name: requiredString(item.name, "name"),
      slug: requiredString(item.slug, "slug"),
      category: requiredString(item.category, "category"),
      imageUrl: requiredString(item.imageUrl, "imageUrl"),
      description: requiredString(item.description, "description"),
      tags: Array.isArray(item.tags)
        ? item.tags.map((tag) => requiredString(tag, "tag"))
        : typeof item.tags === "string"
          ? item.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
          : [],
      sortOrder: Number.isInteger(sortOrder) ? sortOrder : index + 1,
    };
  });
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${field} is required`);
  return value.trim();
}

function noStoreJson(payload: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return Response.json(payload, { ...init, headers });
}
