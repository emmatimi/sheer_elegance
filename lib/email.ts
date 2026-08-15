import type { Booking, SalonSettings } from "@/db/salon";

type EmailConfig = {
  provider: "resend" | "brevo";
  apiKey: string;
  from: string;
  adminTo: string;
  logoUrl: string | null;
};

type EmailAttachment = {
  filename: string;
  content: string;
  contentType: string;
  encoded?: boolean;
};

export async function sendBookingEmails(input: {
  booking: Booking;
  settings: SalonSettings;
}) {
  const config = getEmailConfig();
  if (!config) return { skipped: true, reason: emailUnsupportedReason() };

  const receiptAttachments = input.booking.receiptHtml
    ? [{
        filename: `sheer-elegance-receipt-${input.booking.id}.html`,
        content: input.booking.receiptHtml,
        contentType: "text/html",
      }]
    : [];
  const attachments = [...receiptAttachments, ...hairstyleReferenceAttachments(input.booking)];

  await Promise.all([
    sendEmail(config, {
      to: input.booking.customerEmail,
      subject: "Your Sheer Elegance appointment request",
      html: customerBookingEmail(input.booking, input.settings, config.logoUrl),
      attachments,
    }),
    sendEmail(config, {
      to: config.adminTo,
      subject: `New booking: ${input.booking.customerName}`,
      html: adminBookingEmail(input.booking, input.settings, config.logoUrl),
      replyTo: input.booking.customerEmail,
      attachments,
    }),
  ]);

  return { skipped: false };
}

export async function sendEmailDiagnostic() {
  const config = getEmailConfig();
  if (!config) {
    return {
      ok: false,
      error: emailUnsupportedReason(),
      config: publicEmailConfig(),
    };
  }

  try {
    const result = await sendEmail(config, {
      to: config.adminTo,
      subject: "Sheer Elegance email test",
      html: layout("<p>This is a test email from Sheer Elegance.</p>", config.logoUrl),
    });

    return {
      ok: true,
      provider: config.provider,
      result,
      config: publicEmailConfig(),
    };
  } catch (error) {
    return {
      ok: false,
      error: normalizeMailError(error),
      config: publicEmailConfig(),
    };
  }
}

export function normalizeMailError(error: unknown) {
  if (error instanceof Error) {
    return { message: error.message };
  }
  return { message: "Unknown email error" };
}

export function bookingReceiptHtml(booking: Booking, settings: SalonSettings) {
  return layout(`
    <p>Payment receipt</p>
    ${detailsTable([
      ["Receipt no.", booking.paymentReference ?? `booking-${booking.id}`],
      ["Customer", booking.customerName],
      ["Category", booking.serviceName],
      ...hairstyleRows(booking),
      ["Appointment", `${booking.appointmentDate} - ${booking.appointmentTime}`],
      ["Transaction reference", booking.transactionReference ?? "Pending"],
      ["Address", settings.studioAddress],
    ])}
    ${hairstyleBlock(booking)}
  `, publicLogoUrl());
}

async function sendEmail(
  config: EmailConfig,
  message: {
    to: string;
    subject: string;
    html: string;
    replyTo?: string;
    attachments?: EmailAttachment[];
  },
) {
  if (config.provider === "resend") {
    return sendWithResend(config, message);
  }
  return sendWithBrevo(config, message);
}

async function sendWithResend(
  config: EmailConfig,
  message: {
    to: string;
    subject: string;
    html: string;
    replyTo?: string;
    attachments?: EmailAttachment[];
  },
) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: config.from,
      to: [message.to],
      subject: message.subject,
      html: message.html,
      reply_to: message.replyTo,
      attachments: message.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.encoded ? attachment.content : toBase64(attachment.content),
      })),
    }),
  });

  return readProviderResponse(response);
}

async function sendWithBrevo(
  config: EmailConfig,
  message: {
    to: string;
    subject: string;
    html: string;
    replyTo?: string;
    attachments?: EmailAttachment[];
  },
) {
  const from = parseAddress(config.from);
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": config.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      sender: from,
      to: [{ email: message.to }],
      subject: message.subject,
      htmlContent: message.html,
      replyTo: message.replyTo ? { email: message.replyTo } : undefined,
      attachment: message.attachments?.map((attachment) => ({
        name: attachment.filename,
        content: attachment.encoded ? attachment.content : toBase64(attachment.content),
      })),
    }),
  });

  return readProviderResponse(response);
}

async function readProviderResponse(response: Response) {
  const text = await response.text();
  const body = tryJson(text) ?? text;
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${typeof body === "string" ? body : JSON.stringify(body)}`);
  }
  return body;
}

function getEmailConfig(): EmailConfig | null {
  const provider = cleanEnv(process.env.EMAIL_PROVIDER);
  const from = cleanEnv(process.env.MAIL_FROM);
  const adminTo = cleanEnv(process.env.ADMIN_NOTIFY_EMAIL);
  const logoUrl = publicLogoUrl();

  if (!from || !adminTo) return null;

  if (provider === "resend") {
    const apiKey = cleanEnv(process.env.RESEND_API_KEY);
    return apiKey ? { provider, apiKey, from, adminTo, logoUrl } : null;
  }

  if (provider === "brevo") {
    const apiKey = cleanEnv(process.env.BREVO_API_KEY);
    return apiKey ? { provider, apiKey, from, adminTo, logoUrl } : null;
  }

  return null;
}

function publicEmailConfig() {
  const provider = cleanEnv(process.env.EMAIL_PROVIDER) ?? null;
  return {
    provider,
    from: cleanEnv(process.env.MAIL_FROM) ?? null,
    adminTo: cleanEnv(process.env.ADMIN_NOTIFY_EMAIL) ?? null,
    resendKeyPresent: Boolean(cleanEnv(process.env.RESEND_API_KEY)),
    brevoKeyPresent: Boolean(cleanEnv(process.env.BREVO_API_KEY)),
    smtpConfigured: Boolean(cleanEnv(process.env.SMTP_HOST)),
  };
}

function emailUnsupportedReason() {
  if (cleanEnv(process.env.SMTP_HOST)) {
    return {
      message: "SMTP/Gmail credentials are configured, but this Worker runtime cannot open SMTP socket connections. Use EMAIL_PROVIDER=resend or EMAIL_PROVIDER=brevo with an API key.",
    };
  }
  return {
    message: "Email provider is not configured. Set EMAIL_PROVIDER=resend with RESEND_API_KEY, or EMAIL_PROVIDER=brevo with BREVO_API_KEY.",
  };
}

function customerBookingEmail(booking: Booking, settings: SalonSettings, logoUrl: string | null) {
  return layout(`
    <p>Hello ${escapeHtml(firstName(booking.customerName))},</p>
    <p>Thank you for booking with Oreoluwa Sheer Elegance. We have received your appointment request and our team will confirm shortly.</p>
    ${detailsTable([
      ["Category", booking.serviceName],
      ...hairstyleRows(booking),
      ["Date", booking.appointmentDate],
      ["Time", booking.appointmentTime],
      ["Address", settings.studioAddress],
      ["Phone", settings.phone],
      ...noteRows(booking),
    ])}
    ${hairstyleBlock(booking)}
    <p>We await your arrival.</p>
  `, logoUrl);
}

function adminBookingEmail(booking: Booking, settings: SalonSettings, logoUrl: string | null) {
  return layout(`
    <p>New appointment request received.</p>
    ${detailsTable([
      ["Customer", booking.customerName],
      ["Phone", booking.customerPhone],
      ["Email", booking.customerEmail],
      ["Category", booking.serviceName],
      ...hairstyleRows(booking),
      ["Date", booking.appointmentDate],
      ["Time", booking.appointmentTime],
      ...noteRows(booking),
    ])}
    ${hairstyleBlock(booking)}
  `, logoUrl);
}

function hairstyleRows(booking: Booking): Array<[string, string]> {
  if (!booking.hairstyleName) return [];
  return [["Hairstyle/service option", booking.hairstyleName]];
}

function hairstyleBlock(booking: Booking, options: { allowDataImage?: boolean } = {}) {
  if (!booking.hairstyleName && !booking.hairstyleImageUrl && !booking.hairstyleDescription) return "";
  const imageUrl = emailSafeImageUrl(booking.hairstyleImageUrl, { allowDataImage: options.allowDataImage });
  const title = booking.hairstyleName ? escapeHtml(booking.hairstyleName) : "";
  return `
    <p style="margin:20px 0 8px;color:#8d7132">Hairstyle/service option reference</p>
    ${title ? `<p style="margin:0 0 8px;font-weight:700">${title}</p>` : ""}
    ${imageUrl ? `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(booking.hairstyleName ?? "Hairstyle reference")}" style="width:100%;max-height:360px;object-fit:cover;border:1px solid #ded6ca;display:block" />` : ""}
    ${booking.hairstyleDescription ? `<p>${escapeHtml(booking.hairstyleDescription)}</p>` : ""}
  `;
}

function hairstyleReferenceAttachments(booking: Booking): EmailAttachment[] {
  const image = dataImageAttachment(booking.hairstyleImageUrl, `hairstyle-reference-${booking.id}`);
  return image ? [image] : [];
}

function dataImageAttachment(value: string | null | undefined, basename: string): EmailAttachment | null {
  const raw = cleanEnv(value ?? undefined);
  if (!raw?.startsWith("data:image/")) return null;
  const match = raw.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  const contentType = match[1];
  const extension = contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "png";
  return {
    filename: `${basename}.${extension}`,
    content: match[2],
    contentType,
    encoded: true,
  };
}

function noteRows(booking: Booking): Array<[string, string]> {
  return booking.notes ? [["Customer note", booking.notes]] : [];
}

function layout(content: string, logoUrl: string | null) {
  return `
    <div style="background:#f6f1e7;padding:16px;font-family:Arial,sans-serif;color:#16130f;word-break:break-word">
      <div style="max-width:620px;margin:0 auto;background:#fffdf8;border:1px solid #ded6ca;padding:24px 16px">
        ${logoUrl ? `<img src="${escapeHtml(logoUrl)}" alt="Oreoluwa Sheer Elegance" style="width:180px;max-width:100%;height:auto;margin:0 auto 24px;display:block" />` : ""}
        ${content}
        <p style="margin-top:28px;color:#8d7132">Oreoluwa Sheer Elegance</p>
      </div>
    </div>
  `;
}

function publicLogoUrl() {
  return emailSafeImageUrl(cleanEnv(process.env.PUBLIC_LOGO_URL) ?? "/sheer-elegance-logo.png");
}

function emailSafeImageUrl(value: string | null | undefined, options: { allowDataImage?: boolean } = {}) {
  const raw = cleanEnv(value ?? undefined);
  if (!raw) return null;
  if (raw.startsWith("data:")) return options.allowDataImage ? raw : null;
  if (/^https?:\/\//i.test(raw)) return raw;
  const siteUrl = cleanEnv(process.env.SITE_URL);
  if (!siteUrl || /^https?:\/\/localhost(?::|\/|$)/i.test(siteUrl)) return null;
  return new URL(raw.startsWith("/") ? raw : `/${raw}`, siteUrl).toString();
}

function paymentSummary(booking: Booking) {
  if (booking.paymentOption === "pay_on_arrival") return "Pay at salon";
  return `${booking.paymentStatus} - ${formatNaira(booking.amountPaidNaira || booking.paymentAmountNaira)}`;
}

function formatNaira(value: number) {
  return `NGN ${new Intl.NumberFormat("en-NG").format(value)}`;
}

function detailsTable(rows: Array<[string, string]>) {
  return `
    <table style="width:100%;border-collapse:collapse;margin:24px 0;table-layout:fixed">
      <tbody>
        ${rows.map(([label, value]) => `
          <tr>
            <td style="border-bottom:1px solid #ded6ca;padding:12px 8px;color:#746f65;width:35%;vertical-align:top">${escapeHtml(label)}</td>
            <td style="border-bottom:1px solid #ded6ca;padding:12px 8px;text-align:right;font-weight:700;width:65%;word-wrap:break-word;word-break:break-word;vertical-align:top">${escapeHtml(value)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

function parseAddress(value: string) {
  const match = value.match(/^(.*)<(.+)>$/);
  if (!match) return { email: value.trim() };
  return {
    name: match[1].trim().replace(/^"|"$/g, ""),
    email: match[2].trim(),
  };
}

function toBase64(value: string) {
  return Buffer.from(value, "utf8").toString("base64");
}

function tryJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? name;
}

function cleanEnv(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
