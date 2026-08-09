import { authenticateAdmin, createAdminSessionResponse } from "@/lib/admin-auth";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const email = typeof payload.email === "string" ? payload.email.trim() : "";
    const password = typeof payload.password === "string" ? payload.password : "";

    if (!email || !password) {
      return Response.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const admin = await authenticateAdmin(email, password);
    if (!admin) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    return createAdminSessionResponse(admin);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to sign in" },
      { status: 500 },
    );
  }
}
