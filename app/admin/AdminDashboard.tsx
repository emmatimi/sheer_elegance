"use client";

import { DragEvent, FormEvent, useEffect, useMemo, useState } from "react";

type AdminSection = "bookings" | "services" | "settings";

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
  transactionReference: string | null;
  receiptHtml: string | null;
  status: string;
  createdAt: string;
};

type Pagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

const defaultSettings: SalonSettings = {
  studioAddress: "Private studio address shared after booking confirmation",
  phone: "+234 810 000 2026",
  email: "hello@sheerelegance.ng",
  openingHours: "Tue-Fri 9am-7pm, Sat 8am-6pm",
};

export function AdminDashboard({ section }: { section: AdminSection }) {
  const [checkingSession, setCheckingSession] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [status, setStatus] = useState("");
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 8, total: 0, totalPages: 1 });
  const [settings, setSettings] = useState<SalonSettings>(defaultSettings);
  const [savingServices, setSavingServices] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((response) => response.json())
      .then((payload) => setLoggedIn(Boolean(payload.admin)))
      .finally(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    if (section === "bookings") void loadBookings(1);
    if (section === "services") void loadServices();
    if (section === "settings") void loadSettings();
  }, [loggedIn, section]);

  async function loadBookings(page = pagination.page) {
    const response = await fetch(`/api/admin/bookings?page=${page}&pageSize=${pagination.pageSize}`);
    if (!response.ok) {
      setStatus("Unable to load bookings.");
      return;
    }
    const payload = await response.json();
    setBookings(payload.bookings ?? []);
    setPagination(payload.pagination ?? pagination);
  }

  async function loadServices() {
    const response = await fetch("/api/admin/services");
    if (!response.ok) {
      setStatus("Unable to load services.");
      return;
    }
    const payload = await response.json();
    setServices(payload.services ?? []);
  }

  async function loadSettings() {
    const response = await fetch("/api/admin/settings");
    if (!response.ok) {
      setStatus("Unable to load salon details.");
      return;
    }
    const payload = await response.json();
    setSettings(payload.settings ?? defaultSettings);
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
  }

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    setLoggedIn(false);
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
        setStatus("Image ready. Save services to publish it.");
      }
    };
    reader.readAsDataURL(file);
  }

  function dropServiceImage(event: DragEvent<HTMLLabelElement>, index: number) {
    event.preventDefault();
    event.currentTarget.classList.remove("dragging");
    uploadServiceImage(index, event.dataTransfer.files[0]);
  }

  async function saveServices() {
    setSavingServices(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Unable to save services.");
      setServices(payload.services ?? services);
      setStatus("Services saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save services.");
    } finally {
      setSavingServices(false);
    }
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingSettings(true);
    setStatus("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Unable to save salon details.");
      setSettings(payload.settings ?? settings);
      setStatus("Salon details saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save salon details.");
    } finally {
      setSavingSettings(false);
    }
  }

  const title = useMemo(() => ({
    bookings: "Bookings",
    services: "Services",
    settings: "Salon details",
  })[section], [section]);

  if (checkingSession) {
    return <main className="admin-shell login-shell"><p>Checking admin session…</p></main>;
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
        </form>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <a href="/" className="admin-brand">Oreoluwa<br /><span>Sheer Elegance</span></a>
        <nav>
          <a className={section === "bookings" ? "active" : ""} href="/admin/bookings">Bookings</a>
          <a className={section === "services" ? "active" : ""} href="/admin/services">Services</a>
          <a className={section === "settings" ? "active" : ""} href="/admin/settings">Salon details</a>
        </nav>
        <button onClick={signOut}>Sign out</button>
      </aside>

      <section className="admin-content">
        <div className="admin-top">
          <div><p className="eyebrow dark">Content management</p><h1>{title}</h1></div>
          <div className="admin-actions"><span>{status}</span></div>
        </div>

        {section === "bookings" && (
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <h2>Appointment bookings</h2>
                <p>Review customer appointments, payment status, references and generated receipts.</p>
              </div>
              <span>{pagination.total} total</span>
            </div>
            <div className="admin-booking-list">
              {bookings.length ? bookings.map((booking) => (
                <article key={booking.id}>
                  <div className="booking-main">
                    <p>{booking.appointmentDate} · {booking.appointmentTime}</p>
                    <h3>{booking.customerName}</h3>
                    <span>{booking.serviceName}</span>
                    <span>{booking.customerPhone} · {booking.customerEmail}</span>
                  </div>
                  <div className="booking-meta">
                    <span className="status-pill">{booking.status}</span>
                    <span>{paymentLabel(booking)}</span>
                    <span>Payment: {booking.paymentStatus}</span>
                    {booking.paymentReference && <span>Ref: {booking.paymentReference}</span>}
                    {booking.transactionReference && <span>Txn: {booking.transactionReference}</span>}
                    {booking.receiptHtml
                      ? <a href={downloadReceiptUrl(booking)} download={`receipt-${booking.id}.html`}>Download receipt</a>
                      : <span>No receipt yet</span>}
                  </div>
                </article>
              )) : <p>No bookings yet.</p>}
            </div>
            <div className="admin-pagination">
              <button disabled={pagination.page <= 1} onClick={() => loadBookings(pagination.page - 1)}>Previous</button>
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => loadBookings(pagination.page + 1)}>Next</button>
            </div>
          </section>
        )}

        {section === "services" && (
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <h2>Salon services</h2>
                <p>Edit service cards, prices, timing and images. Changes are published only when you press save.</p>
              </div>
              <button className="button gold" type="button" onClick={saveServices} disabled={savingServices}>
                {savingServices ? "Saving..." : "Save services"}
              </button>
            </div>
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
            <div className="admin-sticky-save">
              <button className="button gold" type="button" onClick={saveServices} disabled={savingServices}>
                {savingServices ? "Saving..." : "Save services"}
              </button>
            </div>
          </section>
        )}

        {section === "settings" && (
          <section className="admin-panel">
            <form onSubmit={saveSettings}>
              <div className="admin-panel-heading">
                <div>
                  <h2>Salon details</h2>
                  <p>These details appear in booking emails and receipts.</p>
                </div>
                <button className="button gold" type="submit" disabled={savingSettings}>
                  {savingSettings ? "Saving..." : "Save details"}
                </button>
              </div>
              <div className="admin-settings-grid">
                <label>Studio address<input value={settings.studioAddress} onChange={(event) => setSettings((current) => ({ ...current, studioAddress: event.target.value }))} /></label>
                <label>Phone<input value={settings.phone} onChange={(event) => setSettings((current) => ({ ...current, phone: event.target.value }))} /></label>
                <label>Email<input value={settings.email} onChange={(event) => setSettings((current) => ({ ...current, email: event.target.value }))} /></label>
                <label>Opening hours<input value={settings.openingHours} onChange={(event) => setSettings((current) => ({ ...current, openingHours: event.target.value }))} /></label>
              </div>
            </form>
          </section>
        )}
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
