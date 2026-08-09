"use client";

import { DragEvent, FormEvent, useEffect, useState } from "react";

type ServiceRecord = {
  id: number;
  name: string;
  slug: string;
  category: string;
  priceNaira: number;
  durationMinutes: number;
  imageUrl: string;
  shortDescription: string;
  isFeatured: boolean;
  sortOrder: number;
};

type SalonSettings = {
  studioAddress: string;
  phone: string;
  email: string;
  openingHours: string;
};

type BookingRecord = {
  id: number;
  serviceName: string;
  stylistName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  appointmentDate: string;
  appointmentTime: string;
  paymentOption: string;
  paymentStatus: string;
  paymentAmountNaira: number;
  amountPaidNaira: number;
  paymentReference: string | null;
  receiptHtml: string | null;
  status: string;
  createdAt: string;
};

const defaultSettings: SalonSettings = {
  studioAddress: "Private studio address shared after booking confirmation",
  phone: "+234 810 000 2026",
  email: "hello@sheerelegance.ng",
  openingHours: "Tue-Fri 9am-7pm, Sat 8am-6pm",
};

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [status, setStatus] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [settings, setSettings] = useState<SalonSettings>(defaultSettings);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((response) => response.json())
      .then((payload) => {
        if (payload.admin) {
          setLoggedIn(true);
          loadAdminData();
        }
      })
      .catch(() => undefined);
  }, []);

  async function loadAdminData() {
    const [servicesResponse, settingsResponse, bookingsResponse] = await Promise.all([
      fetch("/api/admin/services"),
      fetch("/api/admin/settings"),
      fetch("/api/admin/bookings"),
    ]);
    if (servicesResponse.ok) {
      const payload = await servicesResponse.json();
      setServices(payload.services ?? []);
    }
    if (settingsResponse.ok) {
      const payload = await settingsResponse.json();
      setSettings(payload.settings ?? defaultSettings);
    }
    if (bookingsResponse.ok) {
      const payload = await bookingsResponse.json();
      setBookings(payload.bookings ?? []);
    }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: String(form.get("email")),
        password: String(form.get("password")),
      }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      setLoginError(payload?.error ?? "Sign in failed.");
      return;
    }

    setLoggedIn(true);
    setLoginError("");
    await loadAdminData();
  }


  function updateService(index: number, field: keyof ServiceRecord, value: string | boolean) {
    setServices((current) =>
      current.map((service, serviceIndex) =>
        serviceIndex === index
          ? { ...service, [field]: numericServiceField(field) ? Number(value) : value }
          : service,
      ),
    );
  }

  function uploadServiceImage(index: number, file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setStatus("Please upload an image file.");
      return;
    }
    if (file.size > 1_500_000) {
      setStatus("Please use an image smaller than 1.5 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateService(index, "imageUrl", reader.result);
        setStatus("Image ready. Save to publish it.");
      }
    };
    reader.readAsDataURL(file);
  }

  function dropServiceImage(event: DragEvent<HTMLLabelElement>, index: number) {
    event.preventDefault();
    event.currentTarget.classList.remove("dragging");
    uploadServiceImage(index, event.dataTransfer.files[0]);
  }

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    setLoggedIn(false);
  }


  if (!loggedIn) {
    return (
      <main className="admin-shell login-shell">
        <form className="admin-login" onSubmit={login}>
          <p className="eyebrow dark">Admin access</p>
          <h1>Manage Sheer Elegance content</h1>
          <label>Email<input name="email" type="email" required /></label>
          <label>Password<input name="password" type="password" required /></label>
          {loginError && <p className="admin-error">{loginError}</p>}
          <button className="button gold" type="submit">Sign in</button>
          <small>Use an admin account from the MySQL admins table.</small>
        </form>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <a href="/" className="admin-brand">Oreoluwa<br /><span>Sheer Elegance</span></a>
        <nav><a href="#bookings">Bookings</a><a href="#services">Services</a><a href="#settings">Salon details</a></nav>
        <button onClick={signOut}>Sign out</button>
      </aside>
      <section className="admin-content">
        <div className="admin-top">
          <div><p className="eyebrow dark">Content management</p><h1>Oreoluwa Sheer Elegance CMS</h1></div>
          <div className="admin-actions"><span>{status || emailStatus}</span></div>
        </div>

        <section className="admin-panel" id="bookings">
          <h2>Bookings</h2>
          <div className="admin-booking-list">
            {bookings.length ? bookings.map((booking) => (
              <article key={booking.id}>
                <div>
                  <p>{booking.appointmentDate} - {booking.appointmentTime}</p>
                  <h3>{booking.customerName}</h3>
                  <span>{booking.serviceName}</span>
                  <span>{paymentLabel(booking)}{booking.paymentStatus !== "not_required" ? ` · ${booking.paymentStatus}` : ""}</span>
                </div>
                <div>
                  <a href={`tel:${booking.customerPhone}`}>{booking.customerPhone}</a>
                  <a href={`mailto:${booking.customerEmail}`}>{booking.customerEmail}</a>
                  {booking.receiptHtml && <a href={downloadReceiptUrl(booking)} download={`receipt-${booking.id}.html`} style={{ color: "#d2a84a", fontWeight: "bold" }}>Download Payment Receipt</a>}
                  {booking.status !== "PENDING" && booking.status !== "pending" && <strong>{booking.status}</strong>}
                </div>
              </article>
            )) : <p>No bookings yet.</p>}
          </div>
        </section>

        <section className="admin-panel" id="services">
          <h2>Salon services</h2>
          <p>Edit the service cards, prices, timing and images.</p>
          <div className="admin-service-list">
            {services.map((service, index) => (
              <article key={service.id}>
                <label
                  className="admin-image-drop"
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.currentTarget.classList.add("dragging");
                  }}
                  onDragLeave={(event) => event.currentTarget.classList.remove("dragging")}
                  onDrop={(event) => dropServiceImage(event, index)}
                >
                  <img src={service.imageUrl} alt="" />
                  <span>Drop image here or click to upload</span>
                  <input type="file" accept="image/*" onChange={(event) => uploadServiceImage(index, event.target.files?.[0])} />
                </label>
                <label>Service name<input value={service.name} onChange={(event) => updateService(index, "name", event.target.value)} /></label>
                <label>Slug<input value={service.slug} onChange={(event) => updateService(index, "slug", event.target.value)} /></label>
                <label>Category<input value={service.category} onChange={(event) => updateService(index, "category", event.target.value)} /></label>
                <label>Price in naira<input type="number" min="0" value={service.priceNaira} onChange={(event) => updateService(index, "priceNaira", event.target.value)} /></label>
                <label>Duration minutes<input type="number" min="0" value={service.durationMinutes} onChange={(event) => updateService(index, "durationMinutes", event.target.value)} /></label>
                <label>Sort order<input type="number" value={service.sortOrder} onChange={(event) => updateService(index, "sortOrder", event.target.value)} /></label>
                <label>Description<textarea value={service.shortDescription} onChange={(event) => updateService(index, "shortDescription", event.target.value)} /></label>
                <label className="admin-checkbox"><input type="checkbox" checked={service.isFeatured} onChange={(event) => updateService(index, "isFeatured", event.target.checked)} /> Featured</label>
              </article>
            ))}
          </div>
        </section>

        <section className="admin-panel" id="settings">
          <h2>Salon details</h2>
          <div className="admin-settings-grid">
            <label>Studio address<input value={settings.studioAddress} onChange={(event) => setSettings((current) => ({ ...current, studioAddress: event.target.value }))} /></label>
            <label>Phone<input value={settings.phone} onChange={(event) => setSettings((current) => ({ ...current, phone: event.target.value }))} /></label>
            <label>Email<input value={settings.email} onChange={(event) => setSettings((current) => ({ ...current, email: event.target.value }))} /></label>
            <label>Opening hours<input value={settings.openingHours} onChange={(event) => setSettings((current) => ({ ...current, openingHours: event.target.value }))} /></label>
          </div>
        </section>

      </section>
    </main>
  );
}

function numericServiceField(field: keyof ServiceRecord) {
  return field === "priceNaira" || field === "durationMinutes" || field === "sortOrder";
}

function paymentLabel(booking: BookingRecord) {
  if (booking.paymentOption === "pay_on_arrival") return "Pay at salon";
  const amount = booking.amountPaidNaira || booking.paymentAmountNaira;
  return `${booking.paymentOption.replaceAll("_", " ")} ${formatNaira(amount)}`;
}

function formatNaira(value: number) {
  return `NGN ${new Intl.NumberFormat("en-NG").format(value)}`;
}

function downloadReceiptUrl(booking: BookingRecord) {
  return `data:text/html;charset=utf-8,${encodeURIComponent(booking.receiptHtml ?? "")}`;
}
