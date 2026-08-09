import { getAdminSession } from "@/lib/admin-auth";

export async function GET(request: Request) {
  const admin = getAdminSession(request);
  return Response.json({ admin });
}
