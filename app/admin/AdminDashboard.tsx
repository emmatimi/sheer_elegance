"use client";

import { DragEvent, FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";

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
  const [activeSection, setActiveSection] = useState<AdminSection>(section);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [status, setStatus] = useState("");
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 8, total: 0, totalPages: 1 });
  const [settings, setSettings] = useState<SalonSettings>(defaultSettings);
  const [savingServices, setSavingServices] = useState(false);
  const [savingServiceId, setSavingServiceId] = useState<number | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [editingServices, setEditingServices] = useState<Record<number, ServiceRecord>>({});
  const [modalImageUrl, setModalImageUrl] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState("");

  useEffect(() => {
    setActiveSection(section);
  }, [section]);

  useEffect(() => {
    fetch("/api/admin/me")
      .then((response) => response.json())
      .then((payload) => setLoggedIn(Boolean(payload.admin)))
      .finally(() => setCheckingSession(false));
  }, []);

  useEffect(() => {
    if (!loggedIn) return;
    if (activeSection === "bookings") void loadBookings(1);
    if (activeSection === "services") void loadServices();
    if (activeSection === "settings") void loadSettings();
  }, [loggedIn, activeSection, bookingDate]);

  async function loadBookings(page = pagination.page) {
    const dateQuery = bookingDate ? `&date=${encodeURIComponent(bookingDate)}` : "";
    const response = await fetch(`/api/admin/bookings?page=${page}&pageSize=${pagination.pageSize}${dateQuery}`);
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

  function openSection(event: MouseEvent<HTMLAnchorElement>, nextSection: AdminSection) {
    event.preventDefault();
    setStatus("");
    setActiveSection(nextSection);
    window.history.pushState(null, "", `/admin/${nextSection}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function addServiceFromModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") ?? "").trim();
    const category = String(form.get("category") ?? "").trim();
    const slug = String(form.get("slug") ?? "").trim() || slugify(name);
    const shortDescription = String(form.get("shortDescription") ?? "").trim();
    const imageUrl = modalImageUrl;
    const priceNaira = Number(form.get("priceNaira") ?? 0);
    const durationHours = Number(form.get("durationHours") ?? 0);
    const extraMinutes = Number(form.get("durationMinutes") ?? 0);
    const durationMinutes = (durationHours * 60) + extraMinutes;

    if (!name || !category || !shortDescription || !imageUrl) {
      setStatus("Service name, category, image and description are required.");
      return;
    }
    if (
      !Number.isFinite(priceNaira) ||
      priceNaira < 0 ||
      !Number.isInteger(durationHours) ||
      durationHours < 0 ||
      !Number.isInteger(extraMinutes) ||
      extraMinutes < 0 ||
      extraMinutes > 59 ||
      durationMinutes < 1
    ) {
      setStatus("Service price must be valid, and duration must be at least 1 minute. Minutes should be 0-59.");
      return;
    }

    const nextServices = [
      ...services,
      {
        id: -Date.now(),
        name,
        slug,
        category,
        priceNaira,
        durationMinutes,
        imageUrl,
        shortDescription,
        isFeatured: false,
        sortOrder: services.length + 1,
      },
    ];

    setSavingServices(true);
    setStatus("");
    try {
      await persistServices(nextServices);
      setServiceModalOpen(false);
      setModalImageUrl("");
      event.currentTarget.reset();
      setStatus("New service saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save new service.");
    } finally {
      setSavingServices(false);
    }
  }

  function startEditingService(service: ServiceRecord) {
    setEditingServices((current) => ({ ...current, [service.id]: { ...service } }));
    setStatus("");
  }

  function cancelEditingService(serviceId: number) {
    setEditingServices((current) => {
      const next = { ...current };
      delete next[serviceId];
      return next;
    });
    setStatus("");
  }

  function updateServiceDraft(serviceId: number, field: keyof ServiceRecord, value: string | boolean) {
    setEditingServices((current) => {
      const draft = current[serviceId];
      if (!draft) return current;
      return {
        ...current,
        [serviceId]: {
          ...draft,
          [field]: numericServiceField(field) ? Number(value) : value,
        },
      };
    });
  }

  function readImageFile(file: File | undefined, onReady: (imageUrl: string) => void) {
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
        onReady(reader.result);
        setStatus("Image ready.");
      }
    };
    reader.readAsDataURL(file);
  }

  function uploadServiceImage(serviceId: number, file: File | undefined) {
    readImageFile(file, (imageUrl) => updateServiceDraft(serviceId, "imageUrl", imageUrl));
  }

  function dropServiceImage(event: DragEvent<HTMLLabelElement>, serviceId: number) {
    event.preventDefault();
    event.currentTarget.classList.remove("dragging");
    uploadServiceImage(serviceId, event.dataTransfer.files[0]);
  }

  function dropModalImage(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.currentTarget.classList.remove("dragging");
    readImageFile(event.dataTransfer.files[0], setModalImageUrl);
  }

  async function persistServices(nextServices: ServiceRecord[]) {
    const response = await fetch("/api/admin/services", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ services: nextServices }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error ?? "Unable to save services.");
    setServices(payload.services ?? nextServices);
    return payload.services ?? nextServices;
  }

  async function saveService(serviceId: number) {
    const draft = editingServices[serviceId];
    if (!draft) return;
    setSavingServiceId(serviceId);
    setStatus("");
    try {
      const nextServices = services.map((service) => service.id === serviceId ? draft : service);
      await persistServices(nextServices);
      cancelEditingService(serviceId);
      setStatus("Service saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save service.");
    } finally {
      setSavingServiceId(null);
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
  })[activeSection], [activeSection]);

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
          <a className={activeSection === "bookings" ? "active" : ""} href="/admin/bookings" onClick={(event) => openSection(event, "bookings")}>Bookings</a>
          <a className={activeSection === "services" ? "active" : ""} href="/admin/services" onClick={(event) => openSection(event, "services")}>Services</a>
          <a className={activeSection === "settings" ? "active" : ""} href="/admin/settings" onClick={(event) => openSection(event, "settings")}>Salon details</a>
        </nav>
        <button onClick={signOut}>Sign out</button>
      </aside>

      <section className="admin-content">
        <div className="admin-top">
          <div><p className="eyebrow dark">Content management</p><h1>{title}</h1></div>
          <div className="admin-actions"><span>{status}</span></div>
        </div>

        {activeSection === "bookings" && (
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <h2>Appointment bookings</h2>
                <p>Review customer appointments, payment status, references and generated receipts.</p>
              </div>
              <div className="admin-filter-bar">
                <label>Filter by date<input type="date" value={bookingDate} onChange={(event) => setBookingDate(event.target.value)} /></label>
                {bookingDate && <button type="button" onClick={() => setBookingDate("")}>Clear</button>}
                <span>{pagination.total} total</span>
              </div>
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
                    {booking.paymentStatus !== "not_required" && <span>Payment: {booking.paymentStatus}</span>}
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

        {activeSection === "services" && (
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <h2>Salon services</h2>
                <p>Edit service cards, prices, timing and images. Changes are published only when you press save.</p>
              </div>
              <div className="admin-button-group">
                <button className="button ghost" type="button" onClick={() => setServiceModalOpen(true)}>Add service</button>
              </div>
            </div>
            <div className="admin-service-list">
              {services.map((service, index) => (
                <article key={service.id}>
                  {(() => {
                    const draft = editingServices[service.id];
                    const editableService = draft ?? service;
                    const isEditing = Boolean(draft);
                    return (
                  <div className="admin-service-editor">
                    {isEditing ? (
                      <label
                        className="admin-image-drop"
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.currentTarget.classList.add("dragging");
                        }}
                        onDragLeave={(event) => event.currentTarget.classList.remove("dragging")}
                        onDrop={(event) => dropServiceImage(event, service.id)}
                      >
                        <img src={editableService.imageUrl} alt="" />
                        <span>Drop image here or click to upload</span>
                        <input type="file" accept="image/*" onChange={(event) => uploadServiceImage(service.id, event.target.files?.[0])} />
                      </label>
                    ) : (
                      <button className="admin-image-preview" type="button" onClick={() => setPreviewImageUrl(service.imageUrl)}>
                        <img src={service.imageUrl} alt="" />
                        <span>View image</span>
                      </button>
                    )}
                    <div className="admin-service-fields">
                      <div className="admin-service-card-head wide">
                        <div>
                          <p>#{index + 1} · {service.category}</p>
                          <h3>{service.name}</h3>
                        </div>
                        {isEditing ? (
                          <div className="admin-card-actions">
                            <button className="button gold" type="button" onClick={() => saveService(service.id)} disabled={savingServiceId === service.id}>
                              {savingServiceId === service.id ? "Saving..." : "Save"}
                            </button>
                            <button type="button" onClick={() => cancelEditingService(service.id)}>Cancel</button>
                          </div>
                        ) : (
                          <button className="button ghost" type="button" onClick={() => startEditingService(service)}>Edit</button>
                        )}
                      </div>
                      {isEditing ? (
                        <>
                          <label className="wide">Service name<input value={editableService.name} onChange={(event) => updateServiceDraft(service.id, "name", event.target.value)} /></label>
                          <label>Slug<input value={editableService.slug} onChange={(event) => updateServiceDraft(service.id, "slug", event.target.value)} /></label>
                          <label>Category<input value={editableService.category} onChange={(event) => updateServiceDraft(service.id, "category", event.target.value)} /></label>
                          <label>Price in naira<input type="number" min="0" value={editableService.priceNaira} onChange={(event) => updateServiceDraft(service.id, "priceNaira", event.target.value)} /></label>
                          <label>Duration hours<input type="number" min="0" value={Math.floor(editableService.durationMinutes / 60)} onChange={(event) => updateServiceDraft(service.id, "durationMinutes", (Number(event.target.value) * 60) + (editableService.durationMinutes % 60))} /></label>
                          <label>Duration minutes<input type="number" min="0" max="59" value={editableService.durationMinutes % 60} onChange={(event) => updateServiceDraft(service.id, "durationMinutes", (Math.floor(editableService.durationMinutes / 60) * 60) + Number(event.target.value))} /></label>
                          <label>Sort order<input type="number" value={editableService.sortOrder} onChange={(event) => updateServiceDraft(service.id, "sortOrder", event.target.value)} /></label>
                          <label className="wide">Description<textarea value={editableService.shortDescription} onChange={(event) => updateServiceDraft(service.id, "shortDescription", event.target.value)} /></label>
                        </>
                      ) : (
                        <div className="admin-service-readonly wide">
                          <p>{service.shortDescription}</p>
                          <dl>
                            <div><dt>Slug</dt><dd>{service.slug}</dd></div>
                            <div><dt>Price</dt><dd>{formatNaira(service.priceNaira)}</dd></div>
                            <div><dt>Duration</dt><dd>{formatDuration(service.durationMinutes)}</dd></div>
                            <div><dt>Sort</dt><dd>{service.sortOrder}</dd></div>
                          </dl>
                        </div>
                      )}
                    </div>
                  </div>
                    );
                  })()}
                </article>
              ))}
            </div>
          </section>
        )}

        {activeSection === "settings" && (
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
      {serviceModalOpen && (
        <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="add-service-title">
          <button className="admin-modal-backdrop" type="button" aria-label="Close add service modal" onClick={() => setServiceModalOpen(false)} />
          <form className="admin-modal-card" onSubmit={addServiceFromModal}>
            <div className="admin-modal-heading">
              <div>
                <p className="eyebrow dark">New service</p>
                <h2 id="add-service-title">Add salon service</h2>
              </div>
              <button type="button" onClick={() => setServiceModalOpen(false)}>×</button>
            </div>
            <div className="admin-modal-grid">
              <label className="wide">Service name<input name="name" required placeholder="Silk press and trim" /></label>
              <label>Slug<input name="slug" placeholder="silk-press-and-trim" /></label>
              <label>Category<input name="category" required placeholder="Signature care" /></label>
              <label>Price in naira<input name="priceNaira" type="number" min="0" required placeholder="30000" /></label>
              <label>Duration hours<input name="durationHours" type="number" min="0" defaultValue="1" /></label>
              <label>Duration minutes<input name="durationMinutes" type="number" min="0" max="59" defaultValue="0" /></label>
              <label
                className="admin-image-drop wide"
                onDragOver={(event) => {
                  event.preventDefault();
                  event.currentTarget.classList.add("dragging");
                }}
                onDragLeave={(event) => event.currentTarget.classList.remove("dragging")}
                onDrop={dropModalImage}
              >
                {modalImageUrl ? <img src={modalImageUrl} alt="" /> : <div className="admin-image-empty">No image selected</div>}
                <span>Drop service image here or click to upload</span>
                <input type="file" accept="image/*" onChange={(event) => readImageFile(event.target.files?.[0], setModalImageUrl)} />
              </label>
              <label className="wide">Description<textarea name="shortDescription" required placeholder="Short description customers will see." /></label>
            </div>
            <div className="admin-modal-actions">
              <button type="button" onClick={() => setServiceModalOpen(false)}>Cancel</button>
              <button className="button gold" type="submit" disabled={savingServices}>{savingServices ? "Saving..." : "Save service"}</button>
            </div>
          </form>
        </div>
      )}
      {previewImageUrl && (
        <div className="admin-modal image-viewer" role="dialog" aria-modal="true" aria-label="Service image preview">
          <button className="admin-modal-backdrop" type="button" aria-label="Close image preview" onClick={() => setPreviewImageUrl("")} />
          <div className="admin-image-viewer-card">
            <button type="button" onClick={() => setPreviewImageUrl("")}>×</button>
            <img src={previewImageUrl} alt="Service preview" />
          </div>
        </div>
      )}
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

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours && minutes) return `${hours} hr ${minutes} min`;
  if (hours) return `${hours} hr`;
  return `${minutes} min`;
}

function downloadReceiptUrl(booking: BookingRecord) {
  return `data:text/html;charset=utf-8,${encodeURIComponent(booking.receiptHtml ?? "")}`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
