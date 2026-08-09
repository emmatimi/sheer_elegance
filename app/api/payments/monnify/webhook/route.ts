import { completePaidBooking } from "@/lib/payment-completion";
import { verifyMonnifyWebhookSignature } from "@/lib/monnify";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("monnify-signature");

  if (!verifyMonnifyWebhookSignature(body, signature)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(body) as {
    eventType?: string;
    eventData?: {
      paymentReference?: string;
      paymentStatus?: string;
    };
  };

  if (
    payload.eventType === "SUCCESSFUL_TRANSACTION" &&
    payload.eventData?.paymentReference &&
    payload.eventData.paymentStatus === "PAID"
  ) {
    await completePaidBooking(payload.eventData.paymentReference);
  }

  return Response.json({ ok: true });
}
