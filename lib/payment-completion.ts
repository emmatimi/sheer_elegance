import { getBookingByPaymentReference, getSalonSettings, markBookingPaid } from "@/db/salon";
import { bookingReceiptHtml, sendBookingEmails } from "@/lib/email";
import { verifyMonnifyPayment } from "@/lib/monnify";

export async function completePaidBooking(paymentReference: string) {
  const payment = await verifyMonnifyPayment(paymentReference);
  if (payment.paymentStatus !== "PAID") {
    throw new Error("Payment has not been completed");
  }

  const booking = await getBookingByPaymentReference(paymentReference);
  if (!booking) throw new Error("Booking not found");

  const settings = await getSalonSettings();
  const paidBooking = {
    ...booking,
    paymentStatus: "paid" as const,
    amountPaidNaira: Math.round(Number(payment.amountPaid ?? payment.totalPayable ?? 0)),
    transactionReference: payment.transactionReference ?? null,
  };
  const receiptHtml = bookingReceiptHtml(paidBooking, settings);

  await markBookingPaid({
    paymentReference,
    transactionReference: payment.transactionReference ?? "",
    amountPaidNaira: paidBooking.amountPaidNaira,
    receiptHtml,
  });

  await sendBookingEmails({
    booking: { ...paidBooking, receiptHtml, status: "confirmed" },
    settings,
  });
}
