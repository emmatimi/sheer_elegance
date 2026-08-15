import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { queryRows, withDbConnection } from "./index";

export type Service = {
  id: number;
  name: string;
  category: string;
  priceNaira: number;
  durationMinutes: number;
  imageUrl: string;
  shortDescription: string;
  isFeatured: boolean;
};

export type Hairstyle = {
  id: number;
  name: string;
  category: string;
  imageUrl: string;
  description: string;
  tags: string[];
};

export type SalonSettings = {
  studioAddress: string;
  phone: string;
  email: string;
  openingHours: string;
};

export type Booking = {
  id: number;
  serviceId: number;
  serviceName: string;
  stylistName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  paymentOption: PaymentOption;
  paymentStatus: PaymentStatus;
  paymentAmountNaira: number;
  amountPaidNaira: number;
  paymentReference: string | null;
  transactionReference: string | null;
  receiptHtml: string | null;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes: string | null;
  hairstyleName: string | null;
  hairstyleCategory: string | null;
  hairstyleImageUrl: string | null;
  hairstyleDescription: string | null;
  createdAt: string;
};

export type PaymentOption = "deposit" | "half" | "full" | "pay_on_arrival";
export type PaymentStatus = "not_required" | "pending" | "paid" | "failed";

type ServiceRow = RowDataPacket & {
  id: number;
  name: string;
  category: string;
  price_naira: number;
  duration_minutes: number;
  image_url: string;
  short_description: string;
  is_featured: number | boolean;
};

type SettingRow = RowDataPacket & {
  setting_key: string;
  setting_value: string;
};

type BookingRow = RowDataPacket & {
  id: number;
  service_id: number;
  service_name: string;
  stylist_name: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  appointment_date: string;
  appointment_time: string;
  payment_option: PaymentOption;
  payment_status: PaymentStatus;
  payment_amount_naira: number;
  amount_paid_naira: number;
  payment_reference: string | null;
  transaction_reference: string | null;
  receipt_html: string | null;
  status: Booking["status"];
  notes: string | null;
  hairstyle_name: string | null;
  hairstyle_category: string | null;
  hairstyle_image_url: string | null;
  hairstyle_description: string | null;
  created_at: Date | string;
};

type HairstyleRow = RowDataPacket & {
  id: number;
  name: string;
  category: string;
  image_url: string;
  description: string;
  tags: string;
};

type BookedTimeRow = RowDataPacket & {
  appointment_date: string;
  appointment_time: string;
};

type CountRow = RowDataPacket & {
  total: number;
};

export async function getServices() {
  const rows = await queryRows<ServiceRow>(
    `SELECT id, name, category, price_naira, duration_minutes, image_url,
      short_description, is_featured
     FROM services
     ORDER BY id ASC`,
  );

  return rows.map(toService);
}

export async function getHairstyles() {
  const rows = await queryRows<HairstyleRow>(
    `SELECT id, name, category, image_url, description, tags
     FROM hairstyles
     ORDER BY id ASC`,
  );
  return rows.map(toHairstyle);
}

export async function saveHairstyles(hairstyles: Hairstyle[]) {
  await withDbConnection(async (connection) => {
    try {
      await connection.beginTransaction();
      for (const hairstyle of hairstyles) {
        const values = [
          hairstyle.name,
          hairstyle.category,
          hairstyle.imageUrl,
          hairstyle.description,
          hairstyle.tags.join(","),
        ];

        if (hairstyle.id > 0) {
          await connection.query(
            `UPDATE hairstyles
             SET name = ?, category = ?, image_url = ?,
               description = ?, tags = ?
             WHERE id = ?`,
            [...values, hairstyle.id],
          );
        } else {
          await connection.query(
            `INSERT INTO hairstyles
              (name, category, image_url, description, tags)
             VALUES (?, ?, ?, ?, ?)`,
            values,
          );
        }
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  });
}

export async function deleteHairstyle(id: number) {
  await withDbConnection(async (connection) =>
    connection.query(`DELETE FROM hairstyles WHERE id = ?`, [id]),
  );
}

export async function saveServices(services: Service[]) {
  await withDbConnection(async (connection) => {
    try {
      await connection.beginTransaction();
      for (const service of services) {
        const values = [
          service.name,
          service.name,
          service.priceNaira,
          service.durationMinutes,
          service.imageUrl,
          service.shortDescription,
          service.isFeatured ? 1 : 0,
        ];

        if (service.id > 0) {
          await connection.query(
            `UPDATE services
             SET name = ?, category = ?,
               price_naira = ?, duration_minutes = ?,
               image_url = ?, short_description = ?,
               is_featured = ?
             WHERE id = ?`,
            [...values, service.id],
          );
        } else {
          await connection.query(
            `INSERT INTO services (
              name, category, price_naira, duration_minutes,
              image_url, short_description, is_featured
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            values,
          );
        }
      }
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  });
}

export async function deleteService(id: number) {
  await withDbConnection(async (connection) => {
    const [result] = await connection.query<ResultSetHeader>(`DELETE FROM services WHERE id = ?`, [id]);
    if (result.affectedRows === 0) throw new Error("Service was not found or has already been deleted.");
  });
}

export async function getSalonSettings(): Promise<SalonSettings> {
  const rows = await queryRows<SettingRow>(
    `SELECT setting_key, setting_value FROM salon_settings`,
  );
  const settings = Object.fromEntries(
    rows.map((row) => [row.setting_key, row.setting_value]),
  );

  return {
    studioAddress:
      settings.studio_address ??
      "Private studio address shared after booking confirmation",
    phone: settings.phone ?? "+234 810 000 2026",
    email: settings.email ?? "hello@sheerelegance.ng",
    openingHours: settings.opening_hours ?? "Tue-Fri 9am-7pm, Sat 8am-6pm",
  };
}

export async function saveSalonSettings(settings: SalonSettings) {
  const entries = [
    ["studio_address", settings.studioAddress],
    ["phone", settings.phone],
    ["email", settings.email],
    ["opening_hours", settings.openingHours],
  ];

  await withDbConnection(async (connection) =>
    connection.query(
      `INSERT INTO salon_settings (setting_key, setting_value)
       VALUES ${entries.map(() => "(?, ?)").join(", ")}
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
      entries.flat(),
    ),
  );
}

export async function createBooking(input: {
  serviceId: number;
  stylistName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  paymentOption: PaymentOption;
  paymentStatus: PaymentStatus;
  paymentAmountNaira: number;
  paymentReference?: string | null;
  status?: Booking["status"];
  notes?: string;
  hairstyleName?: string | null;
  hairstyleCategory?: string | null;
  hairstyleImageUrl?: string | null;
  hairstyleDescription?: string | null;
}) {
  const [result] = await withDbConnection(async (connection) =>
    connection.query(
      `INSERT INTO bookings (
        service_id, stylist_name, customer_name, customer_phone, customer_email,
        appointment_date, appointment_time, payment_option, payment_status,
        payment_amount_naira, payment_reference, status, notes,
        hairstyle_name, hairstyle_category, hairstyle_image_url, hairstyle_description
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?
      )`,
      [
        input.serviceId,
        input.stylistName,
        input.customerName,
        input.customerPhone,
        input.customerEmail,
        input.appointmentDate,
        input.appointmentTime,
        input.paymentOption,
        input.paymentStatus,
        input.paymentAmountNaira,
        input.paymentReference ?? null,
        input.status ?? "pending",
        input.notes ?? null,
        input.hairstyleName ?? null,
        input.hairstyleCategory ?? null,
        input.hairstyleImageUrl ?? null,
        input.hairstyleDescription ?? null,
      ],
    ),
  );

  return result;
}

export async function getBookedTimes() {
  const rows = await queryRows<BookedTimeRow>(
    `SELECT appointment_date, appointment_time
     FROM bookings
     WHERE status <> 'cancelled'
       AND payment_status <> 'failed'`,
  );

  return rows.reduce<Record<string, string[]>>((dates, row) => {
    dates[row.appointment_date] ??= [];
    dates[row.appointment_date].push(row.appointment_time);
    return dates;
  }, {});
}

export async function getBooking(id: number) {
  const rows = await queryRows<BookingRow>(
    `SELECT bookings.id, bookings.service_id, services.name AS service_name,
      bookings.stylist_name, bookings.customer_name, bookings.customer_phone,
      bookings.customer_email, bookings.appointment_date, bookings.appointment_time,
      bookings.payment_option, bookings.payment_status, bookings.payment_amount_naira,
      bookings.amount_paid_naira, bookings.payment_reference, bookings.transaction_reference,
      bookings.receipt_html, bookings.status, bookings.notes,
      bookings.hairstyle_name, bookings.hairstyle_category,
      bookings.hairstyle_image_url, bookings.hairstyle_description,
      bookings.created_at
     FROM bookings
     INNER JOIN services ON services.id = bookings.service_id
     WHERE bookings.id = ?
     LIMIT 1`,
    [id],
  );

  return rows[0] ? toBooking(rows[0]) : null;
}

export async function getBookings() {
  const rows = await queryRows<BookingRow>(
    `SELECT bookings.id, bookings.service_id, services.name AS service_name,
      bookings.stylist_name, bookings.customer_name, bookings.customer_phone,
      bookings.customer_email, bookings.appointment_date, bookings.appointment_time,
      bookings.payment_option, bookings.payment_status, bookings.payment_amount_naira,
      bookings.amount_paid_naira, bookings.payment_reference, bookings.transaction_reference,
      bookings.receipt_html, bookings.status, bookings.notes,
      bookings.hairstyle_name, bookings.hairstyle_category,
      bookings.hairstyle_image_url, bookings.hairstyle_description,
      bookings.created_at
     FROM bookings
     INNER JOIN services ON services.id = bookings.service_id
     ORDER BY bookings.created_at DESC, bookings.id DESC
     LIMIT 100`,
  );

  return rows.map(toBooking);
}

export async function getBookingsPage(page = 1, pageSize = 10, appointmentDate?: string) {
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.min(50, Math.max(1, Math.floor(pageSize)));
  const offset = (safePage - 1) * safePageSize;
  const filters: string[] = [];
  const values: unknown[] = [];

  if (appointmentDate) {
    filters.push("bookings.appointment_date = ?");
    values.push(appointmentDate);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const [countRow] = await queryRows<CountRow>(
    `SELECT COUNT(*) AS total FROM bookings ${whereClause}`,
    values,
  );
  const rows = await queryRows<BookingRow>(
    `SELECT bookings.id, bookings.service_id, services.name AS service_name,
      bookings.stylist_name, bookings.customer_name, bookings.customer_phone,
      bookings.customer_email, bookings.appointment_date, bookings.appointment_time,
      bookings.payment_option, bookings.payment_status, bookings.payment_amount_naira,
      bookings.amount_paid_naira, bookings.payment_reference, bookings.transaction_reference,
      bookings.receipt_html, bookings.status, bookings.notes,
      bookings.hairstyle_name, bookings.hairstyle_category,
      bookings.hairstyle_image_url, bookings.hairstyle_description,
      bookings.created_at
     FROM bookings
     INNER JOIN services ON services.id = bookings.service_id
     ${whereClause}
     ORDER BY bookings.created_at DESC, bookings.id DESC
     LIMIT ? OFFSET ?`,
    [...values, safePageSize, offset],
  );

  const total = Number(countRow?.total ?? 0);
  return {
    bookings: rows.map(toBooking),
    pagination: {
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages: Math.max(1, Math.ceil(total / safePageSize)),
    },
  };
}

export async function getBookingByPaymentReference(paymentReference: string) {
  const rows = await queryRows<BookingRow>(
    `SELECT bookings.id, bookings.service_id, services.name AS service_name,
      bookings.stylist_name, bookings.customer_name, bookings.customer_phone,
      bookings.customer_email, bookings.appointment_date, bookings.appointment_time,
      bookings.payment_option, bookings.payment_status, bookings.payment_amount_naira,
      bookings.amount_paid_naira, bookings.payment_reference, bookings.transaction_reference,
      bookings.receipt_html, bookings.status, bookings.notes,
      bookings.hairstyle_name, bookings.hairstyle_category,
      bookings.hairstyle_image_url, bookings.hairstyle_description,
      bookings.created_at
     FROM bookings
     INNER JOIN services ON services.id = bookings.service_id
     WHERE bookings.payment_reference = ?
     LIMIT 1`,
    [paymentReference],
  );

  return rows[0] ? toBooking(rows[0]) : null;
}

export async function markBookingPaid(input: {
  paymentReference: string;
  transactionReference: string;
  amountPaidNaira: number;
  receiptHtml: string;
}) {
  await withDbConnection(async (connection) =>
    connection.query(
      `UPDATE bookings
       SET payment_status = 'paid',
         amount_paid_naira = ?,
         transaction_reference = ?,
         receipt_html = ?,
         status = 'confirmed'
       WHERE payment_reference = ?`,
      [
        input.amountPaidNaira,
        input.transactionReference,
        input.receiptHtml,
        input.paymentReference,
      ],
    ),
  );
}

function toService(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    category: row.category || row.name,
    priceNaira: row.price_naira,
    durationMinutes: row.duration_minutes,
    imageUrl: row.image_url,
    shortDescription: row.short_description,
    isFeatured: Boolean(row.is_featured),
  };
}

function toHairstyle(row: HairstyleRow): Hairstyle {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    imageUrl: row.image_url,
    description: row.description,
    tags: row.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
  };
}

function toBooking(row: BookingRow): Booking {
  return {
    id: row.id,
    serviceId: row.service_id,
    serviceName: row.service_name,
    stylistName: row.stylist_name,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    appointmentDate: row.appointment_date,
    appointmentTime: row.appointment_time,
    paymentOption: row.payment_option,
    paymentStatus: row.payment_status,
    paymentAmountNaira: row.payment_amount_naira,
    amountPaidNaira: row.amount_paid_naira,
    paymentReference: row.payment_reference,
    transactionReference: row.transaction_reference,
    receiptHtml: row.receipt_html,
    status: row.status,
    notes: row.notes,
    hairstyleName: row.hairstyle_name,
    hairstyleCategory: row.hairstyle_category,
    hairstyleImageUrl: row.hairstyle_image_url,
    hairstyleDescription: row.hairstyle_description,
    createdAt:
      row.created_at instanceof Date
        ? row.created_at.toISOString()
        : String(row.created_at),
  };
}
