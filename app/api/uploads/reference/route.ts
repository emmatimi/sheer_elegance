import { requireAdminSession } from "@/lib/admin-auth";

export async function GET(request: Request) {
  return createUploadSignature(request);
}

export async function POST(request: Request) {
  return createUploadSignature(request);
}

async function createUploadSignature(request: Request) {
  try {
    const isAdminAsset = new URL(request.url).searchParams.get("scope") === "admin";
    if (isAdminAsset) {
      const session = requireAdminSession(request);
      if (session instanceof Response) return session;
    }
    const publicKey = process.env.IMAGEKIT_PUBLIC_KEY?.trim();
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim();
    if (!publicKey || !privateKey) {
      return Response.json({ error: "Missing ImageKit upload credentials" }, { status: 500 });
    }

    const token = globalThis.crypto.randomUUID();
    const expire = Math.floor(Date.now() / 1000) + 5 * 60;
    const signature = await createImageKitSignature(token, expire, privateKey);

    return Response.json(
      {
        publicKey,
        token,
        expire,
        signature,
        folder: isAdminAsset
          ? `${process.env.IMAGEKIT_UPLOAD_FOLDER?.trim() || "/sheer_elegance/booking-references"}/admin-assets`
          : process.env.IMAGEKIT_UPLOAD_FOLDER?.trim() || "/sheer_elegance/booking-references",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to prepare image upload" },
      { status: 500 },
    );
  }
}

async function createImageKitSignature(token: string, expire: number, privateKey: string) {
  const encoder = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(privateKey),
    { name: "HMAC", hash: "SHA-1" },
    false,
    ["sign"],
  );
  const signed = await globalThis.crypto.subtle.sign("HMAC", key, encoder.encode(`${token}${expire}`));
  return Array.from(new Uint8Array(signed), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
