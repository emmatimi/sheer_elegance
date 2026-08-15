"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const fallbackServices = [
  { id: 1, name: "Silk press and trim", category: "Natural hair", price: "NGN 30,000", priceNaira: 30000, duration: "2 hrs", durationMinutes: 120, image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=85" },
  { id: 2, name: "Boho knotless braids", category: "Protective styling", price: "NGN 65,000", priceNaira: 65000, duration: "5 hrs", durationMinutes: 300, image: "https://images.unsplash.com/photo-1605980776566-0486c3ac7617?auto=format&fit=crop&w=900&q=85" },
  { id: 3, name: "Frontal wig install", category: "Wigs and lace", price: "NGN 45,000", priceNaira: 45000, duration: "2 hrs 30 min", durationMinutes: 150, image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=85" },
  { id: 4, name: "Ghana weaving cornrows", category: "Braids", price: "NGN 25,000", priceNaira: 25000, duration: "2 hrs 30 min", durationMinutes: 150, image: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=900&q=85" },
  { id: 5, name: "Relaxer retouch and treatment", category: "Hair care", price: "NGN 28,000", priceNaira: 28000, duration: "2 hrs", durationMinutes: 120, image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=85" },
  { id: 6, name: "Bridal hair styling", category: "Events", price: "NGN 120,000", priceNaira: 120000, duration: "Consultation", durationMinutes: 0, image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=900&q=85" },
];

type Service = (typeof fallbackServices)[number];
type PaymentOption = "deposit" | "half" | "full" | "pay_on_arrival";
type ApiService = { id: number; name: string; category: string; priceNaira: number; durationMinutes: number; imageUrl: string; shortDescription?: string };
type Hairstyle = { id: number; name: string; category: string; imageUrl: string; description: string; tags: string[] };
type ManualReference = { imageUrl: string; fileName: string } | null;

const times = ["9:00 AM", "10:30 AM", "12:00 PM", "2:30 PM", "4:00 PM", "5:30 PM"];
const todayIso = new Date().toISOString().slice(0, 10);

export default function BookPage() {
  const [availableServices, setAvailableServices] = useState<Service[]>(fallbackServices);
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [step, setStep] = useState(1);
  const [service, setService] = useState(fallbackServices[0].name);
  const [date, setDate] = useState(todayIso);
  const [time, setTime] = useState(times[1]);
  const [paymentOption] = useState<PaymentOption>("pay_on_arrival");
  const [details, setDetails] = useState({ name: "", phone: "", email: "", notes: "" });
  const [manualOptionName, setManualOptionName] = useState("");
  const [manualReference, setManualReference] = useState<ManualReference>(null);
  const [referenceError, setReferenceError] = useState("");
  const [referenceUploading, setReferenceUploading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookedTimes, setBookedTimes] = useState<Record<string, string[]>>({});
  const [hairstyles, setHairstyles] = useState<Hairstyle[]>([]);
  const [selectedHairstyle, setSelectedHairstyle] = useState<Hairstyle | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/services")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((payload: { services?: ApiService[] }) => {
        if (!active || !payload.services?.length) return;
        const nextServices = payload.services.map(mapApiService);
        setAvailableServices(nextServices);
        const categoryName = new URLSearchParams(window.location.search).get("category") ?? new URLSearchParams(window.location.search).get("service");
        const matchedByUrl = categoryName && nextServices.find((item) => item.name === categoryName);
        const nextService = matchedByUrl ?? nextServices[0];
        setService(nextService.name);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const updateScroll = () => setHeaderScrolled(window.scrollY > 24);
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  useEffect(() => {
    let active = true;
    loadAvailability()
      .then((nextBookedTimes) => {
        if (active) setBookedTimes(nextBookedTimes);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const optionId = Number(new URLSearchParams(window.location.search).get("option") ?? new URLSearchParams(window.location.search).get("hairstyle"));
    fetch("/api/hairstyles")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((payload: { hairstyles?: Hairstyle[] }) => {
        if (!active) return;
        const nextHairstyles = payload.hairstyles ?? [];
        setHairstyles(nextHairstyles);
        const matched = Number.isInteger(optionId) ? nextHairstyles.find((item) => item.id === optionId) : null;
        if (matched) setSelectedHairstyle(matched);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedHairstyle) return;
    const matchedService = bestServiceForHairstyle(selectedHairstyle, availableServices);
    if (matchedService) {
      setService(matchedService.name);
      return;
    }
  }, [availableServices, selectedHairstyle]);

  useEffect(() => {
    const currentDateIsFull = (bookedTimes[date]?.length ?? 0) >= times.length;
    if (currentDateIsFull) {
      const nextDay = createCalendarDays(bookedTimes).find((day) => !day.disabled);
      if (nextDay) {
        setDate(nextDay.iso);
        setTime(firstAvailableTime(nextDay.iso, bookedTimes) ?? times[0]);
      }
      return;
    }
    if (bookedTimes[date]?.includes(time)) {
      const nextTime = firstAvailableTime(date, bookedTimes);
      if (nextTime) setTime(nextTime);
    }
  }, [bookedTimes, date, time]);

  const selectedService = useMemo(() => availableServices.find((item) => item.name === service) ?? availableServices[0], [availableServices, service]);
  const optionName = selectedHairstyle?.name ?? manualOptionName.trim();
  const optionDescription = selectedHairstyle?.description ?? "";
  const optionReferenceImage = selectedHairstyle?.imageUrl ?? manualReference?.imageUrl ?? null;
  const availableTimes = times.filter((item) => !bookedTimes[date]?.includes(item));
  const calendarDays = useMemo(() => createCalendarDays(bookedTimes), [bookedTimes]);

  function chooseCategory(category: string) {
    setService(category);
    if (selectedHairstyle?.category !== category) {
      setSelectedHairstyle(null);
      setManualOptionName("");
      setManualReference(null);
      setReferenceError("");
      setReferenceUploading(false);
    }
  }

  function switchToManualInput() {
    if (selectedHairstyle) {
      setManualOptionName(selectedHairstyle.name);
    }
    setSelectedHairstyle(null);
    setManualReference(null);
    setReferenceError("");
    setReferenceUploading(false);
  }

  async function handleReferenceFile(file: File | null) {
    if (!file) return;
    setReferenceError("");
    if (!file.type.startsWith("image/")) {
      setReferenceError("Please upload an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setReferenceError("Please use an image smaller than 5 MB.");
      return;
    }
    setReferenceUploading(true);
    try {
      const imageUrl = await uploadReferenceImageToImageKit(file);
      setManualReference({ imageUrl, fileName: file.name });
    } catch (error) {
      setReferenceError(error instanceof Error ? error.message : "We could not upload that image. Please check your connection and try again.");
    } finally {
      setReferenceUploading(false);
    }
  }

  function chooseDate(day: { iso: string; disabled: boolean }) {
    if (day.disabled) return;
    setBookingError("");
    setDate(day.iso);
    setTime(firstAvailableTime(day.iso, bookedTimes) ?? times[0]);
  }

  async function submitBooking(event: FormEvent) {
    event.preventDefault();
    if (!details.name || !details.phone || !details.email) return;
    if (!optionName) {
      setStep(1);
      setBookingError("Please enter the style or service you want to book.");
      return;
    }
    const latestBookedTimes = await loadAvailability();
    setBookedTimes(latestBookedTimes);
    if (latestBookedTimes[date]?.includes(time)) {
      setStep(2);
      setTime(firstAvailableTime(date, latestBookedTimes) ?? time);
      setBookingError("That time was just booked. Please choose another available time.");
      return;
    }
    if ((latestBookedTimes[date]?.length ?? 0) >= times.length) {
      setStep(2);
      setBookingError("That day is fully booked. Please choose another date.");
      return;
    }
    setBookingError("");
    const response = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        serviceId: selectedService.id,
        stylistName: "Salon team",
        customerName: details.name,
        customerPhone: details.phone,
        customerEmail: details.email,
        appointmentDate: date,
        appointmentTime: time,
        paymentOption,
        notes: details.notes,
        hairstyle: {
          name: optionName,
          category: selectedService.name,
          imageUrl: optionReferenceImage,
          description: optionDescription,
        },
      }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      if (response.status === 409 && payload?.bookedTimes) {
        setBookedTimes(payload.bookedTimes);
        setStep(2);
        setTime(firstAvailableTime(date, payload.bookedTimes) ?? time);
        setBookingError(payload.error ?? "That time is no longer available.");
        return;
      }
      setBookingError("We could not save your appointment request. Please try again.");
      return;
    }
    const payload = await response.json();
    if (payload.checkoutUrl) {
      window.location.href = payload.checkoutUrl;
      return;
    }
    setConfirmed(true);
  }

  return (
    <main className="booking-page">
      <header className={headerScrolled ? "site-header scrolled" : "site-header"}>
        <a href="/" className="logo-wrap" aria-label="Sheer Elegance home">
          <img src="/sheer-elegance-logo.png" alt="Oreoluwa Sheer Elegance" />
        </a>
        <nav className={menuOpen ? "nav-links open" : "nav-links"} aria-label="Main navigation">
          <a href="/" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="/#services" onClick={() => setMenuOpen(false)}>Services</a>
          <a href="/hairstyles" onClick={() => setMenuOpen(false)}>Hairstyles</a>
          <a href="/#gallery" onClick={() => setMenuOpen(false)}>Our work</a>
          <a href="/#about" onClick={() => setMenuOpen(false)}>About</a>
          <a href="/#contact" onClick={() => setMenuOpen(false)}>Contact</a>
        </nav>
        <a className="header-book" href="/book">Book now</a>
        <button className="menu-button" aria-label="Toggle menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button>
      </header>

      <section className="hairstyles-hero booking-hero">
        <div className="hairstyles-hero-bg" aria-hidden="true" />
        <div className="hairstyles-hero-shade" aria-hidden="true" />
        <div className="hairstyles-hero-content">
          <p className="eyebrow hero-accent">Appointment desk</p>
          <h1>
            Book your chair
            <em className="script-word"> with clarity.</em>
          </h1>
          <p>Pick a look or service, choose an available time, and confirm your appointment. Fully booked days and unavailable times are disabled automatically.</p>
        </div>
      </section>

      <section className="booking-page-shell">
        <aside className="booking-page-intro">
          <div className="booking-arrival-card">
            <span>Oreoluwa Sheer Elegance</span>
            <h2>We await your arrival</h2>
          </div>
        </aside>

        <section className="booking-page-card" aria-labelledby="booking-title">
          <div className="booking-top"><div><p>Sheer Elegance</p><h2 id="booking-title">Book your appointment</h2></div></div>
          {!confirmed ? <>
            <div className="stepper">{[1, 2, 3, 4].map((n) => <span key={n} className={step >= n ? "active" : ""}>{n}</span>)}</div>
            {step === 1 && <div className="booking-step manual-booking-step">
              <p className="step-label">01 - Tell us what you want</p>
              <div className="gallery-shortcut"><span>Want to pick from our saved looks?</span><a href="/hairstyles">Open hairstyle gallery</a></div>
              {selectedHairstyle && <div className="selected-look-summary"><img src={selectedHairstyle.imageUrl} alt="" /><div><span>Selected from hairstyles</span><strong>{selectedHairstyle.name}</strong><p>{selectedService.name}</p></div></div>}
              <label className="booking-field">Category<select value={selectedService.name} onChange={(event) => chooseCategory(event.target.value)}>{availableServices.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label>
              <label className="booking-field">Style or service name<input value={optionName} readOnly={Boolean(selectedHairstyle)} onChange={(event) => { setSelectedHairstyle(null); setManualOptionName(event.target.value); }} placeholder="Example: Ghana weaving, wig revamp, bridal bun..." /></label>
              {selectedHairstyle && <div className="selected-option-description"><span>Style selected from gallery</span>{optionDescription && <p>{optionDescription}</p>}<button type="button" onClick={switchToManualInput}>Switch to manual input</button></div>}
              <label className="booking-field wide">Optional note<textarea value={details.notes} onChange={(event) => setDetails({ ...details, notes: event.target.value })} placeholder="Tell us the length, size, colour, finish, allergies, timing concern, or anything useful before your visit." /></label>
              {!selectedHairstyle && <label className={referenceUploading ? "reference-drop disabled" : "reference-drop"} onDrop={(event) => { event.preventDefault(); if (!referenceUploading) handleReferenceFile(event.dataTransfer.files[0] ?? null); }} onDragOver={(event) => event.preventDefault()}>
                <input type="file" accept="image/*" disabled={Boolean(selectedHairstyle) || referenceUploading} onChange={(event) => handleReferenceFile(event.target.files?.[0] ?? null)} />
                {referenceUploading ? <><strong>Uploading reference image...</strong><span>Please wait a moment.</span></> : optionReferenceImage ? <><img src={optionReferenceImage} alt="" /><span>{selectedHairstyle ? "Gallery reference attached" : manualReference?.fileName ?? "Reference image attached"}</span></> : <><strong>Drop optional reference image here</strong><span>or click to upload a look you want us to see.</span></>}
              </label>}
              {referenceError && <p className="admin-error">{referenceError}</p>}
              {bookingError && step === 1 && <p className="admin-error">{bookingError}</p>}
            </div>}
            {step === 2 && <div className="booking-step"><p className="step-label">02 - Select a date and time</p><div className="calendar-grid">{calendarDays.map((day) => <button key={day.iso} disabled={day.disabled} className={date === day.iso ? "selected" : ""} onClick={() => chooseDate(day)}><span>{day.weekday}</span><strong>{day.day}</strong></button>)}</div><div className="time-grid">{times.map((item) => <button key={item} disabled={bookedTimes[date]?.includes(item)} className={time === item ? "selected" : ""} onClick={() => { setBookingError(""); setTime(item); }}>{item}</button>)}</div>{availableTimes.length === 0 && <p className="admin-error">This day is fully booked. Please choose another date.</p>}{bookingError && <p className="admin-error">{bookingError}</p>}</div>}
            {step === 3 && <form className="booking-step details-form" id="details-form" onSubmit={(event) => { event.preventDefault(); setStep(4); }}><p className="step-label">03 - Your details</p><label>Full name<input required value={details.name} onChange={(event) => setDetails({ ...details, name: event.target.value })} placeholder="Ada Okafor" /></label><label>Phone number<input required type="tel" value={details.phone} onChange={(event) => setDetails({ ...details, phone: event.target.value })} placeholder="+234 800 000 0000" /></label><label>Email address<input required type="email" value={details.email} onChange={(event) => setDetails({ ...details, email: event.target.value })} placeholder="you@example.com" /></label></form>}
            {step === 4 && <form className="booking-step summary" onSubmit={submitBooking}>
              <p className="step-label">04 - Payment and confirmation</p>
              <div><span>Category</span><strong>{selectedService.name}</strong></div>
              <div><span>Service / hairstyle</span><strong>{optionName}</strong></div>
              {optionDescription && <div><span>Description</span><strong>{optionDescription}</strong></div>}
              {optionReferenceImage && <div><span>Reference image</span><strong>Attached</strong></div>}
              <div><span>Date</span><strong>{date}</strong></div>
              <div><span>Time</span><strong>{time}</strong></div>
              <div><span>Name</span><strong>{details.name}</strong></div>
              <div><span>Phone</span><strong>{details.phone}</strong></div>
              <div><span>Email</span><strong>{details.email}</strong></div>
              {details.notes.trim() && <div><span>Note</span><strong>{details.notes}</strong></div>}
              <p>Your appointment request will be saved. The salon can confirm final service details with you directly.</p>
              {bookingError && <p className="admin-error">{bookingError}</p>}
              <button className="button gold" type="submit">Confirm appointment</button>
            </form>}
            {step < 4 && <div className="booking-actions"><button disabled={step === 1} onClick={() => setStep(step - 1)}>Back</button><button className="next" type={step === 3 ? "submit" : "button"} form={step === 3 ? "details-form" : undefined} disabled={(step === 1 && (!optionName || referenceUploading)) || (step === 2 && availableTimes.length === 0)} onClick={step === 3 ? undefined : () => setStep(step + 1)}>Continue</button></div>}
          </> : <div className="confirmation"><span>✓</span><p>Appointment request received</p><h2>We'll see you soon, {details.name.split(" ")[0]}.</h2><div><strong>{optionName || selectedService.name}</strong><p>{date} at {time}</p></div><a className="button gold" href="/">Back to the website</a></div>}
        </section>
      </section>
    </main>
  );
}

function mapApiService(item: ApiService): Service {
  return {
    id: item.id,
    name: item.name,
    category: item.category,
    price: "",
    priceNaira: 0,
    duration: item.shortDescription || item.category,
    durationMinutes: item.durationMinutes,
    image: item.imageUrl,
  };
}

function createCalendarDays(bookedTimes: Record<string, string[]>) {
  return Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() + index);
    const iso = date.toISOString().slice(0, 10);
    return {
      iso,
      weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
      day: date.getDate(),
      disabled: (bookedTimes[iso]?.length ?? 0) >= times.length,
    };
  });
}

async function loadAvailability() {
  const response = await fetch("/api/availability", { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load availability");
  const payload = await response.json() as { bookedTimes?: Record<string, string[]> };
  return payload.bookedTimes ?? {};
}

function firstAvailableTime(date: string, bookedTimes: Record<string, string[]>) {
  return times.find((item) => !bookedTimes[date]?.includes(item));
}

async function uploadReferenceImageToImageKit(file: File) {
  const authResponse = await fetch("/api/uploads/reference", { cache: "no-store" });
  const auth = await authResponse.json().catch(() => null) as ImageKitAuthPayload | null;
  if (!authResponse.ok || !auth?.publicKey || !auth.signature || !auth.token || !auth.expire) {
    throw new Error(auth?.error ?? "Unable to prepare image upload.");
  }

  const formData = new FormData();
  formData.set("file", file);
  formData.set("fileName", cleanReferenceFileName(file.name));
  formData.set("publicKey", auth.publicKey);
  formData.set("signature", auth.signature);
  formData.set("expire", String(auth.expire));
  formData.set("token", auth.token);
  formData.set("folder", auth.folder || "/sheer_elegance/booking-references");
  formData.set("useUniqueFileName", "true");

  const uploadResponse = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST",
    body: formData,
  });
  const upload = await uploadResponse.json().catch(() => null) as { url?: string; message?: string } | null;
  if (!uploadResponse.ok || !upload?.url) {
    throw new Error(upload?.message ?? "We could not upload that image. Please try again.");
  }
  return upload.url;
}

type ImageKitAuthPayload = {
  publicKey?: string;
  signature?: string;
  token?: string;
  expire?: number;
  folder?: string;
  error?: string;
};

function cleanReferenceFileName(value: string) {
  const safeName = value.trim().replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return safeName || `booking-reference-${Date.now()}.jpg`;
}

function bestServiceForHairstyle(hairstyle: Hairstyle, availableServices: Service[]) {
  const text = `${hairstyle.name} ${hairstyle.category} ${hairstyle.tags.join(" ")}`.toLowerCase();
  const ranked = availableServices
    .map((service) => {
      const serviceText = `${service.name} ${service.category}`.toLowerCase();
      let score = 0;
      if (text.includes("bridal") && serviceText.includes("bridal")) score += 6;
      if (text.includes("silk") && serviceText.includes("silk")) score += 6;
      if ((text.includes("knotless") || text.includes("boho")) && serviceText.includes("knotless")) score += 6;
      if ((text.includes("cornrow") || text.includes("stitch") || text.includes("ghana")) && (serviceText.includes("ghana") || serviceText.includes("cornrow"))) score += 6;
      if ((text.includes("wig") || text.includes("lace")) && (serviceText.includes("wig") || serviceText.includes("frontal"))) score += 6;
      if (text.includes(service.category.toLowerCase())) score += 2;
      return { service, score };
    })
    .sort((a, b) => b.score - a.score);
  return ranked[0]?.score ? ranked[0].service : availableServices[0];
}

function formatNaira(value: number) {
  return `NGN ${new Intl.NumberFormat("en-NG").format(value)}`;
}

function formatDuration(minutes: number) {
  if (!minutes) return "Consultation";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} min`;
  return rest ? `${hours} hrs ${rest} min` : `${hours} hrs`;
}
