import { requireAdminSession } from "@/lib/admin-auth";
import { sendEmailDiagnostic } from "@/lib/email";

export async function POST(request: Request) {
  const session = requireAdminSession(request);
  if (session instanceof Response) return session;

  return Response.json(await sendEmailDiagnostic());
}
