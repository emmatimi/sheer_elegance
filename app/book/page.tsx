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
type Hairstyle = { id: number; name: string; slug: string; category: string; imageUrl: string; description: string; tags: string[] };

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
  const [details, setDetails] = useState({ name: "", phone: "", email: "" });
  const [confirmed, setConfirmed] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookedTimes, setBookedTimes] = useState<Record<string, string[]>>({});
  const [selectedHairstyle, setSelectedHairstyle] = useState<Hairstyle | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/services")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((payload: { services?: ApiService[] }) => {
        if (!active || !payload.services?.length) return;
        const nextServices = payload.services.map(mapApiService);
        setAvailableServices(nextServices);
        const serviceName = new URLSearchParams(window.location.search).get("service");
        const matchedByUrl = serviceName && nextServices.find((item) => item.name === serviceName);
        setService(matchedByUrl?.name ?? nextServices[0].name);
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
    const slug = new URLSearchParams(window.location.search).get("hairstyle");
    if (!slug) return;
    fetch("/api/hairstyles")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((payload: { hairstyles?: Hairstyle[] }) => {
        if (!active) return;
        const matched = (payload.hairstyles ?? []).find((item) => item.slug === slug);
        if (!matched) return;
        setSelectedHairstyle(matched);
        setStep(2);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedHairstyle) return;
    const matchedService = bestServiceForHairstyle(selectedHairstyle, availableServices);
    if (matchedService) setService(matchedService.name);
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
  const availableTimes = times.filter((item) => !bookedTimes[date]?.includes(item));
  const calendarDays = useMemo(() => createCalendarDays(bookedTimes), [bookedTimes]);

  function chooseDate(day: { iso: string; disabled: boolean }) {
    if (day.disabled) return;
    setBookingError("");
    setDate(day.iso);
    setTime(firstAvailableTime(day.iso, bookedTimes) ?? times[0]);
  }

  async function submitBooking(event: FormEvent) {
    event.preventDefault();
    if (!details.name || !details.phone || !details.email) return;
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
        hairstyle: selectedHairstyle ? {
          name: selectedHairstyle.name,
          category: selectedHairstyle.category,
          imageUrl: selectedHairstyle.imageUrl,
          description: selectedHairstyle.description,
        } : null,
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
            <div className="stepper">{(selectedHairstyle ? [2, 3, 4] : [1, 2, 3, 4]).map((n, index) => <span key={n} className={step >= n ? "active" : ""}>{index + 1}</span>)}</div>
            {step === 1 && <div className="booking-step"><p className="step-label">01 - Choose your service</p><div className="option-list">{availableServices.map((item) => <button key={item.name} className={service === item.name ? "selected" : ""} onClick={() => setService(item.name)}><span><b>{item.name}</b><small>{item.category}</small></span></button>)}</div></div>}
            {step === 2 && <div className="booking-step"><p className="step-label">{selectedHairstyle ? "01" : "02"} - Select a date and time</p>{selectedHairstyle && <div className="selected-look-summary"><img src={selectedHairstyle.imageUrl} alt="" /><div><span>Selected look</span><strong>{selectedHairstyle.name}</strong><p>{selectedHairstyle.category}</p></div></div>}<div className="calendar-grid">{calendarDays.map((day) => <button key={day.iso} disabled={day.disabled} className={date === day.iso ? "selected" : ""} onClick={() => chooseDate(day)}><span>{day.weekday}</span><strong>{day.day}</strong></button>)}</div><div className="time-grid">{times.map((item) => <button key={item} disabled={bookedTimes[date]?.includes(item)} className={time === item ? "selected" : ""} onClick={() => { setBookingError(""); setTime(item); }}>{item}</button>)}</div>{availableTimes.length === 0 && <p className="admin-error">This day is fully booked. Please choose another date.</p>}{bookingError && <p className="admin-error">{bookingError}</p>}</div>}
            {step === 3 && <form className="booking-step details-form" id="details-form" onSubmit={(event) => { event.preventDefault(); setStep(4); }}><p className="step-label">03 - Your details</p><label>Full name<input required value={details.name} onChange={(event) => setDetails({ ...details, name: event.target.value })} placeholder="Ada Okafor" /></label><label>Phone number<input required type="tel" value={details.phone} onChange={(event) => setDetails({ ...details, phone: event.target.value })} placeholder="+234 800 000 0000" /></label><label>Email address<input required type="email" value={details.email} onChange={(event) => setDetails({ ...details, email: event.target.value })} placeholder="you@example.com" /></label></form>}
            {step === 4 && <form className="booking-step summary" onSubmit={submitBooking}>
              <p className="step-label">04 - Payment and confirmation</p>
              <div><span>Service</span><strong>{selectedService.name}</strong></div>
              {selectedHairstyle && <div><span>Hairstyle inspiration</span><strong>{selectedHairstyle.name}</strong><small>{selectedHairstyle.category}</small></div>}
              <div><span>When</span><strong>{date} - {time}</strong></div>
              <p>Your appointment request will be saved. The salon can confirm final service details with you directly.</p>
              {bookingError && <p className="admin-error">{bookingError}</p>}
              <button className="button gold" type="submit">Confirm appointment</button>
            </form>}
            {step < 4 && <div className="booking-actions"><button disabled={step === 1 || (selectedHairstyle && step === 2)} onClick={() => setStep(step - 1)}>Back</button><button className="next" type={step === 3 ? "submit" : "button"} form={step === 3 ? "details-form" : undefined} disabled={step === 2 && availableTimes.length === 0} onClick={step === 3 ? undefined : () => setStep(step + 1)}>Continue</button></div>}
          </> : <div className="confirmation"><span>âœ“</span><p>Appointment request received</p><h2>We'll see you soon, {details.name.split(" ")[0]}.</h2><div><strong>{selectedService.name}</strong><p>{selectedHairstyle ? `Inspired by ${selectedHairstyle.name} Â· ` : ""}{date} at {time}</p></div><a className="button gold" href="/">Back to the website</a></div>}
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

function paymentAmountFor(option: PaymentOption, priceNaira: number) {
  if (option === "deposit") return 10000;
  if (option === "half") return Math.ceil(priceNaira / 2);
  if (option === "full") return priceNaira;
  return 0;
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

