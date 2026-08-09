import type { ResultSetHeader } from "mysql2";
import { createBooking, getBookedTimes, getBooking, getSalonSettings, getServices, type PaymentOption } from "@/db/salon";
import { normalizeMailError, sendBookingEmails } from "@/lib/email";
import { initializeMonnifyTransaction } from "@/lib/monnify";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const booking = parseBooking(payload);
    const bookedTimes = await getBookedTimes();
    if (bookedTimes[booking.appointmentDate]?.includes(booking.appointmentTime)) {
      return Response.json(
        {
          error: "That appointment time is no longer available.",
          bookedTimes,
        },
        { status: 409 },
      );
    }

    const services = await getServices();
    const service = services.find((item) => item.id === booking.serviceId);
    if (!service) {
      return Response.json({ error: "Service not found" }, { status: 400 });
    }

    const paymentAmountNaira = paymentAmountFor(booking.paymentOption, service.priceNaira);
    const paymentReference = booking.paymentOption === "pay_on_arrival"
      ? null
      : `sheer-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const result = await createBooking({
      ...booking,
      paymentAmountNaira,
      paymentReference,
      status: booking.paymentOption === "pay_on_arrival" ? "confirmed" : "pending",
    }) as ResultSetHeader;
    const savedBooking = await getBooking(result.insertId);
    if (!savedBooking) {
      return Response.json({ ok: true, emailSent: false }, { status: 201 });
    }

    const settings = await getSalonSettings();
    if (booking.paymentOption !== "pay_on_arrival" && paymentReference) {
      const monnify = await initializeMonnifyTransaction({
        amount: paymentAmountNaira,
        customerName: booking.customerName,
        customerEmail: booking.customerEmail,
        paymentReference,
        description: `${savedBooking.serviceName} appointment`,
      });
      return Response.json(
        { ok: true, booking: savedBooking, checkoutUrl: monnify.checkoutUrl, emailSent: false },
        { status: 201 },
      );
    }

    await sendBookingEmails({ booking: savedBooking, settings })
      .catch((emailError) => {
        console.error("Booking email failed", normalizeMailError(emailError));
      });

    return Response.json(
      { ok: true, booking: savedBooking, emailQueued: true },
      { status: 201 },
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to create booking" },
      { status: 400 },
    );
  }
}

function parseBooking(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid booking request");
  }
  const data = payload as Record<string, unknown>;
  const serviceId = Number(data.serviceId);
  const stylistName = requiredString(data.stylistName, "stylistName");
  const customerName = requiredString(data.customerName, "customerName");
  const customerPhone = requiredString(data.customerPhone, "customerPhone");
  const customerEmail = requiredString(data.customerEmail, "customerEmail");
  const appointmentDate = requiredString(data.appointmentDate, "appointmentDate");
  const appointmentTime = requiredString(data.appointmentTime, "appointmentTime");
  const paymentOption = parsePaymentOption(data.paymentOption);

  if (!Number.isInteger(serviceId) || serviceId < 1) {
    throw new Error("serviceId must be a valid service id");
  }

  return {
    serviceId,
    stylistName,
    customerName,
    customerPhone,
    customerEmail,
    appointmentDate,
    appointmentTime,
    paymentOption,
    paymentStatus: paymentOption === "pay_on_arrival" ? "not_required" as const : "pending" as const,
    paymentAmountNaira: 0,
    paymentReference: null,
    notes: typeof data.notes === "string" ? data.notes.trim() : undefined,
  };
}

function paymentAmountFor(option: PaymentOption, priceNaira: number) {
  if (option === "deposit") return 10000;
  if (option === "half") return Math.ceil(priceNaira / 2);
  if (option === "full") return priceNaira;
  return 0;
}

function parsePaymentOption(value: unknown): PaymentOption {
  if (
    value === "deposit" ||
    value === "half" ||
    value === "full" ||
    value === "pay_on_arrival"
  ) {
    return value;
  }
  return "pay_on_arrival";
}

function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required`);
  }
  return value.trim();
}
