import { createHairstyle, deleteHairstyle, getHairstyles, updateHairstyle, type Hairstyle } from "@/db/salon";
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
    const hairstyle = parseHairstyle(payload) as Hairstyle;
    return noStoreJson({ hairstyle: await updateHairstyle(hairstyle) });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to save hairstyles" },
      { status: 400 },
    );
  }
}

export async function POST(request: Request) {
  const session = requireAdminSession(request);
  if (session instanceof Response) return session;

  try {
    const payload = await request.json();
    const hairstyle = parseHairstyle(payload, { allowNew: true }) as Omit<Hairstyle, "id">;
    return noStoreJson({ hairstyle: await createHairstyle(hairstyle) }, { status: 201 });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to create hairstyle" },
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
    return noStoreJson({ id });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to delete hairstyle" },
      { status: 400 },
    );
  }
}

function parseHairstyle(payload: unknown, options: { allowNew?: boolean } = {}): Hairstyle | Omit<Hairstyle, "id"> {
  if (!payload || typeof payload !== "object") throw new Error("Invalid hairstyles request");
  const item = ((payload as Record<string, unknown>).hairstyle ?? payload) as Record<string, unknown>;
  const id = Number(item.id);
  if (!options.allowNew && (!Number.isInteger(id) || id < 1)) throw new Error("Hairstyle id is invalid");
  const hairstyle = {
    name: requiredString(item.name, "name"),
    category: requiredString(item.category, "category"),
    imageUrl: requiredString(item.imageUrl, "imageUrl"),
    description: requiredString(item.description, "description"),
    tags: Array.isArray(item.tags)
      ? item.tags.map((tag) => requiredString(tag, "tag"))
      : typeof item.tags === "string"
      ? item.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
      : [],
  };
  return options.allowNew ? hairstyle : { id, ...hairstyle };
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
