"use client";

import { DragEvent, FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";

type AdminSection = "bookings" | "services" | "service-guide" | "hairstyles" | "settings";

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

type HairstyleRecord = {
  id: number;
  name: string;
  slug: string;
  category: string;
  imageUrl: string;
  description: string;
  tags: string[];
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
  hairstyleName: string | null;
  hairstyleCategory: string | null;
  hairstyleImageUrl: string | null;
  hairstyleDescription: string | null;
  notes: string | null;
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

const serviceGuide = [
  ["Braiding", "knotless braids, box braids, cornrows, Ghana weaving, stitch braids, feed-in braids, lemonade braids, Fulani braids, tribal braids, bohemian braids, crochet braids, twist braids, Senegalese twists and passion twists."],
  ["Natural hair styling", "afro styling, puff styling, two-strand twists, flat twists, bantu knots, natural updos, finger coils, wash-and-go styling and protective natural hairstyles."],
  ["Ponytails and buns", "sleek ponytails, braided ponytails, curly ponytails, high ponytails, low ponytails, afro ponytails, sleek buns, braided buns, doughnut buns and bridal buns."],
  ["Wig and weave services", "wig installation, frontal installation, closure installation, sew-ins, quick weaves, wig revamping, wig styling, wig customization and lace melting."],
  ["Hair extensions", "clip-ins, tape-ins, micro-links, ponytail extensions, crochet extensions and added-volume styling."],
  ["Relaxed and straight hair styling", "silk press, blow-dry and straightening, roller sets, wrap styling, curls, waves and sleek styling."],
  ["Loc services", "starter locs, retwisting, loc styling, interlocking, faux locs, butterfly locs, soft locs and loc extensions."],
  ["Bridal and occasion styling", "bridal updos, bridesmaid hairstyles, traditional wedding hairstyles, birthday hairstyles, prom styling, formal updos and hair-accessory installation."],
  ["Children’s hairstyling", "kids’ cornrows, braids, beads, twists, ponytails and natural protective styles."],
  ["Hair preparation and finishing", "washing, conditioning, detangling, blow-drying, trimming, edge styling, hair treatment and scalp treatment."],
];

export function AdminDashboard({ section }: { section: AdminSection }) {
  const [activeSection, setActiveSection] = useState<AdminSection>(section);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [status, setStatus] = useState("");
  const [services, setServices] = useState<ServiceRecord[]>([]);
  const [hairstyles, setHairstyles] = useState<HairstyleRecord[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 8, total: 0, totalPages: 1 });
  const [settings, setSettings] = useState<SalonSettings>(defaultSettings);
  const [savingServices, setSavingServices] = useState(false);
  const [savingServiceId, setSavingServiceId] = useState<number | null>(null);
  const [savingHairstyles, setSavingHairstyles] = useState(false);
  const [savingHairstyleId, setSavingHairstyleId] = useState<number | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [hairstyleSearch, setHairstyleSearch] = useState("");
  const [hairstyleCategoryFilter, setHairstyleCategoryFilter] = useState("all");
  const [hairstylePage, setHairstylePage] = useState(1);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [hairstyleModalOpen, setHairstyleModalOpen] = useState(false);
  const [editingServices, setEditingServices] = useState<Record<number, ServiceRecord>>({});
  const [editingHairstyles, setEditingHairstyles] = useState<Record<number, HairstyleRecord>>({});
  const [modalImageUrl, setModalImageUrl] = useState("");
  const [hairstyleModalImageUrl, setHairstyleModalImageUrl] = useState("");
  const [previewImageUrl, setPreviewImageUrl] = useState("");
  const [pendingDelete, setPendingDelete] = useState<{ type: "service" | "hairstyle"; id: number } | null>(null);
  const hairstylePageSize = 8;

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
    if (activeSection === "hairstyles") void loadHairstyles();
    if (activeSection === "settings") void loadSettings();
  }, [loggedIn, activeSection, bookingDate]);

  useEffect(() => {
    setHairstylePage(1);
  }, [hairstyleSearch, hairstyleCategoryFilter]);

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

  async function loadHairstyles() {
    const response = await fetch("/api/admin/hairstyles");
    if (!response.ok) {
      setStatus("Unable to load hairstyles.");
      return;
    }
    const payload = await response.json();
    setHairstyles(payload.hairstyles ?? []);
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
    setAdminMenuOpen(false);
    setPendingDelete(null);
    window.history.pushState(null, "", `/admin/${nextSection}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function addServiceFromModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") ?? "").trim();
    const slug = String(form.get("slug") ?? "").trim() || slugify(name);
    const shortDescription = String(form.get("shortDescription") ?? "").trim();
    const imageUrl = modalImageUrl;

    if (!name || !shortDescription || !imageUrl) {
      setStatus("Service name, image and hairstyle list are required.");
      return;
    }

    const nextServices = [
      ...services,
      {
        id: -Date.now(),
        name,
        slug,
        category: name,
        priceNaira: 0,
        durationMinutes: 0,
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
      formElement.reset();
      setStatus("New service saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save new service.");
    } finally {
      setSavingServices(false);
    }
  }

  function startEditingService(service: ServiceRecord) {
    setEditingServices((current) => ({ ...current, [service.id]: { ...service } }));
    setPendingDelete(null);
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
    if (file.size > 5_000_000) {
      setStatus("Please use an image smaller than 5 MB.");
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

  function dropHairstyleModalImage(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.currentTarget.classList.remove("dragging");
    readImageFile(event.dataTransfer.files[0], setHairstyleModalImageUrl);
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
      setStatus("Success: service changes saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save service.");
    } finally {
      setSavingServiceId(null);
    }
  }

  async function deleteServiceCard(serviceId: number) {
    const service = services.find((item) => item.id === serviceId);
    if (!service) return;
    if (pendingDelete?.type !== "service" || pendingDelete.id !== serviceId) {
      setPendingDelete({ type: "service", id: serviceId });
      setStatus("");
      return;
    }
    setStatus("");
    try {
      const response = await fetch(`/api/admin/services?id=${serviceId}`, { method: "DELETE" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Unable to delete service.");
      setServices(payload.services ?? services.filter((item) => item.id !== serviceId));
      setPendingDelete(null);
      setStatus(`Success: "${service.name}" deleted.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to delete service.");
    }
  }

  async function addHairstyleFromModal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const name = String(form.get("name") ?? "").trim();
    const category = String(form.get("category") ?? services[0]?.name ?? "").trim();
    const slug = String(form.get("slug") ?? "").trim() || slugify(name);
    const description = String(form.get("description") ?? "").trim();
    const tags = String(form.get("tags") ?? "").split(",").map((tag) => tag.trim()).filter(Boolean);
    const imageUrl = hairstyleModalImageUrl;

    if (!name || !category || !description || !imageUrl) {
      setStatus("Hairstyle name, category, image and description are required.");
      return;
    }

    const nextHairstyles = [
      ...hairstyles,
      {
        id: -Date.now(),
        name,
        slug,
        category,
        imageUrl,
        description,
        tags,
        sortOrder: hairstyles.length + 1,
      },
    ];

    setSavingHairstyles(true);
    setStatus("");
    try {
      await persistHairstyles(nextHairstyles);
      setHairstyleModalOpen(false);
      setHairstyleModalImageUrl("");
      formElement.reset();
      setStatus("New hairstyle saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save new hairstyle.");
    } finally {
      setSavingHairstyles(false);
    }
  }

  function startEditingHairstyle(hairstyle: HairstyleRecord) {
    setEditingHairstyles((current) => ({ ...current, [hairstyle.id]: { ...hairstyle } }));
    setPendingDelete(null);
    setStatus("");
  }

  function cancelEditingHairstyle(hairstyleId: number) {
    setEditingHairstyles((current) => {
      const next = { ...current };
      delete next[hairstyleId];
      return next;
    });
    setStatus("");
  }

  function updateHairstyleDraft(hairstyleId: number, field: keyof HairstyleRecord, value: string | number | string[]) {
    setEditingHairstyles((current) => {
      const draft = current[hairstyleId];
      if (!draft) return current;
      return { ...current, [hairstyleId]: { ...draft, [field]: value } };
    });
  }

  function uploadHairstyleImage(hairstyleId: number, file: File | undefined) {
    readImageFile(file, (imageUrl) => updateHairstyleDraft(hairstyleId, "imageUrl", imageUrl));
  }

  function dropHairstyleImage(event: DragEvent<HTMLLabelElement>, hairstyleId: number) {
    event.preventDefault();
    event.currentTarget.classList.remove("dragging");
    uploadHairstyleImage(hairstyleId, event.dataTransfer.files[0]);
  }

  async function persistHairstyles(nextHairstyles: HairstyleRecord[]) {
    const response = await fetch("/api/admin/hairstyles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hairstyles: nextHairstyles }),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.error ?? "Unable to save hairstyles.");
    setHairstyles(payload.hairstyles ?? nextHairstyles);
    return payload.hairstyles ?? nextHairstyles;
  }

  async function saveHairstyle(hairstyleId: number) {
    const draft = editingHairstyles[hairstyleId];
    if (!draft) return;
    setSavingHairstyleId(hairstyleId);
    setStatus("");
    try {
      const nextHairstyles = hairstyles.map((hairstyle) => hairstyle.id === hairstyleId ? draft : hairstyle);
      await persistHairstyles(nextHairstyles);
      cancelEditingHairstyle(hairstyleId);
      setStatus("Success: hairstyle changes saved.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to save hairstyle.");
    } finally {
      setSavingHairstyleId(null);
    }
  }

  async function deleteHairstyleCard(hairstyleId: number) {
    const hairstyle = hairstyles.find((item) => item.id === hairstyleId);
    if (!hairstyle) return;
    if (pendingDelete?.type !== "hairstyle" || pendingDelete.id !== hairstyleId) {
      setPendingDelete({ type: "hairstyle", id: hairstyleId });
      setStatus("");
      return;
    }
    setStatus("");
    try {
      const response = await fetch(`/api/admin/hairstyles?id=${hairstyleId}`, { method: "DELETE" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error ?? "Unable to delete hairstyle.");
      setHairstyles(payload.hairstyles ?? hairstyles.filter((item) => item.id !== hairstyleId));
      setPendingDelete(null);
      setStatus(`Success: "${hairstyle.name}" deleted.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to delete hairstyle.");
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
    "service-guide": "Service guide",
    hairstyles: "Hairstyles",
    settings: "Salon details",
  })[activeSection], [activeSection]);
  const hairstyleCategories = useMemo(() => Array.from(new Set(hairstyles.map((item) => item.category).filter(Boolean))), [hairstyles]);
  const filteredHairstyles = useMemo(() => {
    const query = hairstyleSearch.trim().toLowerCase();
    return hairstyles.filter((item) => {
      const matchesCategory = hairstyleCategoryFilter === "all" || item.category === hairstyleCategoryFilter;
      const matchesSearch = !query || `${item.name} ${item.category} ${item.tags.join(" ")}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [hairstyleCategoryFilter, hairstyleSearch, hairstyles]);
  const hairstyleTotalPages = Math.max(1, Math.ceil(filteredHairstyles.length / hairstylePageSize));
  const safeHairstylePage = Math.min(hairstylePage, hairstyleTotalPages);
  const visibleHairstyles = filteredHairstyles.slice((safeHairstylePage - 1) * hairstylePageSize, safeHairstylePage * hairstylePageSize);

  if (checkingSession) {
    return <main className="admin-shell login-shell"><p>Checking admin session</p></main>;
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
      <div className="admin-mobile-bar">
        <a href="/" className="admin-brand" aria-label="Oreoluwa Sheer Elegance home">
          <img src="/sheer-elegance-logo.png" alt="Oreoluwa Sheer Elegance" />
        </a>
        <button type="button" aria-label="Toggle admin menu" aria-expanded={adminMenuOpen} onClick={() => setAdminMenuOpen((open) => !open)}>
          <span />
          <span />
        </button>
      </div>
      <aside className={adminMenuOpen ? "admin-sidebar open" : "admin-sidebar"}>
        <a href="/" className="admin-brand" aria-label="Oreoluwa Sheer Elegance home">
          <img src="/sheer-elegance-logo.png" alt="Oreoluwa Sheer Elegance" />
        </a>
        <nav>
          <a className={activeSection === "bookings" ? "active" : ""} href="/admin/bookings" onClick={(event) => openSection(event, "bookings")}>Bookings</a>
          <a className={activeSection === "services" ? "active" : ""} href="/admin/services" onClick={(event) => openSection(event, "services")}>Services</a>
          <a className={activeSection === "service-guide" ? "active" : ""} href="/admin/service-guide" onClick={(event) => openSection(event, "service-guide")}>Service guide</a>
          <a className={activeSection === "hairstyles" ? "active" : ""} href="/admin/hairstyles" onClick={(event) => openSection(event, "hairstyles")}>Hairstyles</a>
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
                    {booking.hairstyleName && (
                      <div className="booking-hairstyle-reference">
                        {booking.hairstyleImageUrl && (
                          <button type="button" onClick={() => setPreviewImageUrl(booking.hairstyleImageUrl ?? "")} aria-label={`View ${booking.hairstyleName} hairstyle reference`}>
                            <img src={booking.hairstyleImageUrl} alt={`${booking.hairstyleName} hairstyle reference`} />
                          </button>
                        )}
                        <div>
                          <strong>Hairstyle chosen</strong>
                          <span>{booking.hairstyleName}</span>
                          {booking.hairstyleDescription && <p>{booking.hairstyleDescription}</p>}
                        </div>
                      </div>
                    )}
                    <span>{booking.customerPhone} · {booking.customerEmail}</span>
                    {booking.notes && <span>Note: {booking.notes}</span>}
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
                <p>Edit service names, hairstyle lists and images. Use the guide if you need the recommended service structure.</p>
              </div>
              <div className="admin-button-group">
                <a className="button ghost" href="/admin/service-guide" onClick={(event) => openSection(event, "service-guide")}>Open guide</a>
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
                            <p>Service #{index + 1} · {service.slug}</p>
                          <h3>{service.name}</h3>
                        </div>
                        {isEditing ? (
                          <div className="admin-card-actions">
                            <button className="button gold" type="button" onClick={() => saveService(service.id)} disabled={savingServiceId === service.id}>
                              {savingServiceId === service.id ? "Saving..." : "Save"}
                            </button>
                            <button type="button" onClick={() => cancelEditingService(service.id)}>Cancel</button>
                            {pendingDelete?.type === "service" && pendingDelete.id === service.id ? (<> <button className="danger-confirm" type="button" onClick={() => deleteServiceCard(service.id)}>Confirm delete</button><button type="button" onClick={() => setPendingDelete(null)}>Keep</button></>) : (<button className="danger-icon" type="button" aria-label={`Delete ${service.name}`} onClick={() => deleteServiceCard(service.id)}>Delete</button>)}
                          </div>
                        ) : (
                          <div className="admin-card-actions">
                            <button className="button ghost" type="button" onClick={() => startEditingService(service)}>Edit</button>
                            {pendingDelete?.type === "service" && pendingDelete.id === service.id ? (<> <button className="danger-confirm" type="button" onClick={() => deleteServiceCard(service.id)}>Confirm delete</button><button type="button" onClick={() => setPendingDelete(null)}>Keep</button></>) : (<button className="danger-icon" type="button" aria-label={`Delete ${service.name}`} onClick={() => deleteServiceCard(service.id)}>Delete</button>)}
                          </div>
                        )}
                      </div>
                      {isEditing ? (
                        <>
                          <label className="wide">Service name<input value={editableService.name} onChange={(event) => updateServiceDraft(service.id, "name", event.target.value)} /></label>
                          <label>Slug<input value={editableService.slug} onChange={(event) => updateServiceDraft(service.id, "slug", event.target.value)} /></label>
                          <label className="wide">Hairstyles under this service<textarea value={editableService.shortDescription} onChange={(event) => updateServiceDraft(service.id, "shortDescription", event.target.value)} /></label>
                        </>
                      ) : (
                        <div className="admin-service-readonly wide">
                          <span className="admin-service-list-label">Styles included</span>
                          <ul className="admin-service-bullet-list">
                            {toListItems(service.shortDescription).map((item) => <li key={item}>{item}</li>)}
                          </ul>
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

        {activeSection === "service-guide" && (
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <h2>Service guide</h2>
                <p>Use these recommended service groups and lists when creating service cards.</p>
              </div>
              <div className="admin-button-group">
                <a className="button ghost" href="/admin/services" onClick={(event) => openSection(event, "services")}>Back to services</a>
              </div>
            </div>
            <div className="admin-service-guide standalone">
              <div>
                {serviceGuide.map(([name, description]) => (
                  <article key={name}>
                    <strong>{name}</strong>
                    <span>{description}</span>
                  </article>
                ))}
              </div>
            </div>
          </section>
        )}

        {activeSection === "hairstyles" && (
          <section className="admin-panel">
            <div className="admin-panel-heading">
              <div>
                <h2>Hairstyle library</h2>
                <p>Manage the hairstyle inspiration customers can browse and book from.</p>
              </div>
              <div className="admin-button-group">
                <button className="button ghost" type="button" onClick={() => setHairstyleModalOpen(true)}>Add hairstyle</button>
              </div>
            </div>
            <div className="admin-filter-bar admin-hairstyle-filter">
              <label>Search hairstyles<input value={hairstyleSearch} onChange={(event) => setHairstyleSearch(event.target.value)} placeholder="Search by name, tag or category" /></label>
              <label>Filter by service<select value={hairstyleCategoryFilter} onChange={(event) => setHairstyleCategoryFilter(event.target.value)}><option value="all">All services</option>{hairstyleCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
              <span>{filteredHairstyles.length} total</span>
            </div>
            <div className="admin-service-list admin-hairstyle-list">
              {visibleHairstyles.map((hairstyle) => {
                const draft = editingHairstyles[hairstyle.id];
                const editableHairstyle = draft ?? hairstyle;
                const isEditing = Boolean(draft);
                return (
                  <article key={hairstyle.id}>
                    <div className="admin-service-editor">
                      {isEditing ? (
                        <label
                          className="admin-image-drop"
                          onDragOver={(event) => {
                            event.preventDefault();
                            event.currentTarget.classList.add("dragging");
                          }}
                          onDragLeave={(event) => event.currentTarget.classList.remove("dragging")}
                          onDrop={(event) => dropHairstyleImage(event, hairstyle.id)}
                        >
                          <img src={editableHairstyle.imageUrl} alt="" />
                          <span>Drop image here or click to upload</span>
                          <input type="file" accept="image/*" onChange={(event) => uploadHairstyleImage(hairstyle.id, event.target.files?.[0])} />
                        </label>
                      ) : (
                        <button className="admin-image-preview" type="button" onClick={() => setPreviewImageUrl(hairstyle.imageUrl)}>
                          <img src={hairstyle.imageUrl} alt="" />
                          <span>View image</span>
                        </button>
                      )}
                      <div className="admin-service-fields">
                        <div className="admin-service-card-head wide">
                          <div>
                            <p>{hairstyle.category}</p>
                            <h3>{hairstyle.name}</h3>
                          </div>
                          {isEditing ? (
                            <div className="admin-card-actions">
                              <button className="button gold" type="button" onClick={() => saveHairstyle(hairstyle.id)} disabled={savingHairstyleId === hairstyle.id}>
                                {savingHairstyleId === hairstyle.id ? "Saving..." : "Save"}
                              </button>
                              <button type="button" onClick={() => cancelEditingHairstyle(hairstyle.id)}>Cancel</button>
                              {pendingDelete?.type === "hairstyle" && pendingDelete.id === hairstyle.id ? (<> <button className="danger-confirm" type="button" onClick={() => deleteHairstyleCard(hairstyle.id)}>Confirm delete</button><button type="button" onClick={() => setPendingDelete(null)}>Keep</button></>) : (<button className="danger-icon" type="button" aria-label={`Delete ${hairstyle.name}`} onClick={() => deleteHairstyleCard(hairstyle.id)}>Delete</button>)}
                            </div>
                          ) : (
                            <div className="admin-card-actions">
                              <button className="button ghost" type="button" onClick={() => startEditingHairstyle(hairstyle)}>Edit</button>
                              {pendingDelete?.type === "hairstyle" && pendingDelete.id === hairstyle.id ? (<> <button className="danger-confirm" type="button" onClick={() => deleteHairstyleCard(hairstyle.id)}>Confirm delete</button><button type="button" onClick={() => setPendingDelete(null)}>Keep</button></>) : (<button className="danger-icon" type="button" aria-label={`Delete ${hairstyle.name}`} onClick={() => deleteHairstyleCard(hairstyle.id)}>Delete</button>)}
                            </div>
                          )}
                        </div>
                        {isEditing ? (
                          <>
                            <label className="wide">Hairstyle name<input value={editableHairstyle.name} onChange={(event) => updateHairstyleDraft(hairstyle.id, "name", event.target.value)} /></label>
                            <label>Service category<select value={editableHairstyle.category} onChange={(event) => updateHairstyleDraft(hairstyle.id, "category", event.target.value)}>{services.map((service) => <option key={service.id} value={service.name}>{service.name}</option>)}</select></label>
                            <label className="wide">Tags<input value={editableHairstyle.tags.join(", ")} onChange={(event) => updateHairstyleDraft(hairstyle.id, "tags", event.target.value.split(",").map((tag) => tag.trim()).filter(Boolean))} /></label>
                            <label className="wide">Description<textarea value={editableHairstyle.description} onChange={(event) => updateHairstyleDraft(hairstyle.id, "description", event.target.value)} /></label>
                          </>
                        ) : (
                          <div className="admin-service-readonly wide">
                            <p>{hairstyle.description}</p>
                            <dl>
                              <div><dt>Category</dt><dd>{hairstyle.category}</dd></div>
                              <div><dt>Tags</dt><dd>{hairstyle.tags.join(", ") || "None"}</dd></div>
                            </dl>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
              {!visibleHairstyles.length && <p>No hairstyles match this filter.</p>}
            </div>
            <div className="admin-pagination">
              <button disabled={safeHairstylePage <= 1} onClick={() => setHairstylePage((page) => Math.max(1, page - 1))}>Previous</button>
              <span>Page {safeHairstylePage} of {hairstyleTotalPages}</span>
              <button disabled={safeHairstylePage >= hairstyleTotalPages} onClick={() => setHairstylePage((page) => Math.min(hairstyleTotalPages, page + 1))}>Next</button>
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
              <button type="button" onClick={() => setServiceModalOpen(false)}>Close</button>
            </div>
            <div className="admin-modal-grid">
              <label className="wide">Service name<input name="name" required placeholder="Silk press and trim" /></label>
              <label>Slug<input name="slug" placeholder="silk-press-and-trim" /></label>
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
              <label className="wide">Hairstyles under this service<textarea name="shortDescription" required placeholder="knotless braids, box braids, cornrows..." /></label>
            </div>
            <div className="admin-modal-actions">
              <button type="button" onClick={() => setServiceModalOpen(false)}>Cancel</button>
              <button className="button gold" type="submit" disabled={savingServices}>{savingServices ? "Saving..." : "Save service"}</button>
            </div>
          </form>
        </div>
      )}
      {hairstyleModalOpen && (
        <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="add-hairstyle-title">
          <button className="admin-modal-backdrop" type="button" aria-label="Close add hairstyle modal" onClick={() => setHairstyleModalOpen(false)} />
          <form className="admin-modal-card" onSubmit={addHairstyleFromModal}>
            <div className="admin-modal-heading">
              <div>
                <p className="eyebrow dark">New hairstyle</p>
                <h2 id="add-hairstyle-title">Add hairstyle</h2>
              </div>
              <button type="button" onClick={() => setHairstyleModalOpen(false)}>Close</button>
            </div>
            <div className="admin-modal-grid">
              <label className="wide">Hairstyle name<input name="name" required placeholder="Soft stitch cornrows" /></label>
              <label>Service category<select name="category" required defaultValue=""> <option value="" disabled>Select service</option>{services.map((service) => <option key={service.id} value={service.name}>{service.name}</option>)}</select></label>
              <label className="wide">Tags<input name="tags" placeholder="cornrows, stitch, protective" /></label>
              <label
                className="admin-image-drop wide"
                onDragOver={(event) => {
                  event.preventDefault();
                  event.currentTarget.classList.add("dragging");
                }}
                onDragLeave={(event) => event.currentTarget.classList.remove("dragging")}
                onDrop={dropHairstyleModalImage}
              >
                {hairstyleModalImageUrl ? <img src={hairstyleModalImageUrl} alt="" /> : <div className="admin-image-empty">No image selected</div>}
                <span>Drop hairstyle image here or click to upload</span>
                <input type="file" accept="image/*" onChange={(event) => readImageFile(event.target.files?.[0], setHairstyleModalImageUrl)} />
              </label>
              <label className="wide">Description<textarea name="description" required placeholder="Describe the hairstyle inspiration customers will see." /></label>
            </div>
            <div className="admin-modal-actions">
              <button type="button" onClick={() => setHairstyleModalOpen(false)}>Cancel</button>
              <button className="button gold" type="submit" disabled={savingHairstyles}>{savingHairstyles ? "Saving..." : "Save hairstyle"}</button>
            </div>
          </form>
        </div>
      )}
      {previewImageUrl && (
        <div className="admin-modal image-viewer" role="dialog" aria-modal="true" aria-label="Service image preview">
          <button className="admin-modal-backdrop" type="button" aria-label="Close image preview" onClick={() => setPreviewImageUrl("")} />
          <div className="admin-image-viewer-card">
            <button type="button" onClick={() => setPreviewImageUrl("")}>x</button>
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

function toListItems(value: string) {
  return value
    .split(/,|\n/)
    .map((item) => item.trim().replace(/\.$/, ""))
    .filter(Boolean);
}

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours && minutes) return `${hours} hr ${minutes} min`;
  if (hours) return `${hours} hr`;
  return `${minutes} min`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}


