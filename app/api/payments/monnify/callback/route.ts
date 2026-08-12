export async function GET(request: Request) {
  const url = new URL(request.url);
  const paymentReference =
    url.searchParams.get("paymentReference") ??
    url.searchParams.get("payment_reference");

  if (!paymentReference) {
    return redirectToSite("/?payment=missing-reference");
  }

  return redirectToSite("/?payment=pending-confirmation");
}

function redirectToSite(path: string) {
  return Response.redirect(`${process.env.SITE_URL ?? "http://localhost:3000"}${path}`, 302);
}
