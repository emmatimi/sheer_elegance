import { createHash } from "node:crypto";

type MonnifyInitResponse = {
  requestSuccessful: boolean;
  responseMessage: string;
  responseBody?: {
    checkoutUrl?: string;
    transactionReference?: string;
    paymentReference?: string;
  };
};

type MonnifyQueryResponse = {
  requestSuccessful: boolean;
  responseBody?: {
    paymentStatus?: string;
    amountPaid?: number;
    totalPayable?: number;
    transactionReference?: string;
    paymentReference?: string;
    paidOn?: string;
    paymentMethod?: string;
  };
};

export async function initializeMonnifyTransaction(input: {
  amount: number;
  customerName: string;
  customerEmail: string;
  paymentReference: string;
  description: string;
}) {
  const token = await getMonnifyToken();
  const response = await fetch(`${getMonnifyBaseUrl()}/api/v1/merchant/transactions/init-transaction`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amount,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      paymentReference: input.paymentReference,
      paymentDescription: input.description,
      currencyCode: "NGN",
      contractCode: requiredEnv("MONNIFY_CONTRACT_CODE"),
      redirectUrl: `${requiredEnv("SITE_URL")}/api/payments/monnify/callback`,
      paymentMethods: ["CARD", "ACCOUNT_TRANSFER", "USSD", "PHONE_NUMBER"],
    }),
  });
  const payload = await response.json() as MonnifyInitResponse;

  if (!response.ok || !payload.requestSuccessful || !payload.responseBody?.checkoutUrl) {
    throw new Error(payload.responseMessage || "Unable to initialize Monnify payment");
  }

  return payload.responseBody;
}

export async function verifyMonnifyPayment(paymentReference: string) {
  const token = await getMonnifyToken();
  const url = new URL(`${getMonnifyBaseUrl()}/api/v2/merchant/transactions/query`);
  url.searchParams.set("paymentReference", paymentReference);

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json() as MonnifyQueryResponse;

  if (!response.ok || !payload.requestSuccessful || !payload.responseBody) {
    throw new Error("Unable to verify Monnify payment");
  }

  return payload.responseBody;
}

export function verifyMonnifyWebhookSignature(body: string, signature: string | null) {
  if (!signature) return process.env.MONNIFY_ENV !== "live";
  const expected = createHash("sha512")
    .update(`${requiredEnv("MONNIFY_SECRET_KEY")}${body}`)
    .digest("hex");
  return timingSafeStringEqual(signature, expected);
}

async function getMonnifyToken() {
  const credentials = Buffer.from(
    `${requiredEnv("MONNIFY_API_KEY")}:${requiredEnv("MONNIFY_SECRET_KEY")}`,
  ).toString("base64");
  const response = await fetch(`${getMonnifyBaseUrl()}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
  });
  const payload = await response.json() as {
    requestSuccessful: boolean;
    responseBody?: { accessToken?: string };
    responseMessage?: string;
  };

  if (!response.ok || !payload.requestSuccessful || !payload.responseBody?.accessToken) {
    throw new Error(payload.responseMessage || "Unable to authenticate with Monnify");
  }

  return payload.responseBody.accessToken;
}

function getMonnifyBaseUrl() {
  return process.env.MONNIFY_ENV === "live"
    ? "https://api.monnify.com"
    : "https://sandbox.monnify.com";
}

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function timingSafeStringEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let index = 0; index < a.length; index += 1) {
    result |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }
  return result === 0;
}
