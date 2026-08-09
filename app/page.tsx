"use client";

import { CSSProperties, FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";

const services = [
  { id: 1, name: "Silk press and trim", category: "Natural hair", price: "NGN 30,000", priceNaira: 30000, duration: "2 hrs", durationMinutes: 120, image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=85" },
  { id: 2, name: "Boho knotless braids", category: "Protective styling", price: "NGN 65,000", priceNaira: 65000, duration: "5 hrs", durationMinutes: 300, image: "https://images.unsplash.com/photo-1605980776566-0486c3ac7617?auto=format&fit=crop&w=900&q=85" },
  { id: 3, name: "Frontal wig install", category: "Wigs and lace", price: "NGN 45,000", priceNaira: 45000, duration: "2 hrs 30 min", durationMinutes: 150, image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=85" },
  { id: 4, name: "Ghana weaving cornrows", category: "Braids", price: "NGN 25,000", priceNaira: 25000, duration: "2 hrs 30 min", durationMinutes: 150, image: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=900&q=85" },
  { id: 5, name: "Relaxer retouch and treatment", category: "Hair care", price: "NGN 28,000", priceNaira: 28000, duration: "2 hrs", durationMinutes: 120, image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=85" },
  { id: 6, name: "Bridal hair styling", category: "Events", price: "NGN 120,000", priceNaira: 120000, duration: "Consultation", durationMinutes: 0, image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=900&q=85" },
];

type Service = (typeof services)[number];

type ApiService = {
  id: number;
  name: string;
  category: string;
  priceNaira: number;
  durationMinutes: number;
  imageUrl: string;
};

const times = ["9:00 AM", "10:30 AM", "12:00 PM", "2:30 PM", "4:00 PM", "5:30 PM"];
const todayIso = new Date().toISOString().slice(0, 10);
const heroSlides = [
  {
    image: "https://media.stylist.co.uk/app/uploads/2023/09/14164104/black-woman-hair-crop-1694706100-877x1316.jpg",
    accent: "Be radiant",
    title: "Beauty, crafted",
    highlight: "with intention.",
    copy: "Healthy hair, considered styling and an experience designed entirely around you.",
  },
  {
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1600&q=85",
    accent: "Be different",
    title: "Style, shaped",
    highlight: "for your texture.",
    copy: "Silk press, colour and protective looks refined through calm consultation and expert hands.",
  },
  {
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=85",
    accent: "Be elegant",
    title: "Your chair",
    highlight: "is waiting.",
    copy: "Reserve an appointment for restorative treatments, polished finishes and hair that feels cared for.",
  },
];
const testimonials = [
  { quote: "From the consultation to the final reveal, I felt completely seen. My hair has never looked, or felt, this healthy.", name: "Adaeze N.", detail: "Silk press client" },
  { quote: "The colour was soft, dimensional and exactly right for my skin tone. I left with shine, movement and confidence.", name: "Morenike A.", detail: "Signature colour client" },
  { quote: "My braids were neat, light and beautifully finished. The whole appointment felt calm, and considered.", name: "Tara O.", detail: "Protective styling client" },
];

export default function Home() {
  const [availableServices, setAvailableServices] = useState<Service[]>(services);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [headerScrolled, setHeaderScrolled] = useState(false);
  const [heroSlide, setHeroSlide] = useState(0);
  const [heroCursor, setHeroCursor] = useState({ visible: false, x: 0, y: 0, mode: "right" });
  const [testimonialIndex, setTestimonialIndex] = useState(0);
  const [step, setStep] = useState(1);
  const [service, setService] = useState(services[0].name);
  const [date, setDate] = useState(todayIso);
  const [time, setTime] = useState(times[1]);
  const [paymentOption, setPaymentOption] = useState<"deposit" | "half" | "full" | "pay_on_arrival">("deposit");
  const [details, setDetails] = useState({ name: "", phone: "", email: "" });
  const [confirmed, setConfirmed] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookedTimes, setBookedTimes] = useState<Record<string, string[]>>({});

  useEffect(() => {
    let active = true;
    fetch("/api/services")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((payload: { services?: ApiService[] }) => {
        if (!active || !payload.services?.length) return;
        const nextServices = payload.services.map(mapApiService);
        setAvailableServices(nextServices);
        setService((current) =>
          nextServices.some((item) => item.name === current)
            ? current
            : nextServices[0].name,
        );
      })
      .catch(() => undefined);

    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    loadAvailability()
      .then((nextBookedTimes) => {
        if (active) setBookedTimes(nextBookedTimes);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [bookingOpen]);

  useEffect(() => {
    if (!bookingOpen) return;
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
  }, [bookedTimes, bookingOpen, date, time]);

  useEffect(() => {
    document.body.style.overflow = bookingOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [bookingOpen]);

  useEffect(() => {
    const updateScroll = () => {
      setScrollY(window.scrollY);
      setHeaderScrolled(window.scrollY > 24);
    };
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const slideTimer = window.setInterval(() => {
      setHeroSlide((current) => (current + 1) % heroSlides.length);
    }, 5200);
    return () => window.clearInterval(slideTimer);
  }, []);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const testimonialTimer = window.setInterval(() => {
      setTestimonialIndex((current) => (current + 1) % testimonials.length);
    }, 6400);
    return () => window.clearInterval(testimonialTimer);
  }, []);

  useEffect(() => {
    const animatedItems = document.querySelectorAll<HTMLElement>("[data-animate]");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -12% 0px", threshold: 0.12 });

    animatedItems.forEach((item) => observer.observe(item));
    return () => observer.disconnect();
  }, []);

  const selectedService = useMemo(() => availableServices.find((item) => item.name === service) ?? availableServices[0], [availableServices, service]);
  const availableTimes = times.filter((item) => !bookedTimes[date]?.includes(item));
  const calendarDays = useMemo(() => createCalendarDays(bookedTimes), [bookedTimes]);
  const paymentAmount = paymentAmountFor(paymentOption, selectedService.priceNaira);
  const activeTestimonial = testimonials[testimonialIndex];
  const activeHero = heroSlides[heroSlide];

  function showPreviousHeroSlide() {
    setHeroSlide((current) => (current - 1 + heroSlides.length) % heroSlides.length);
  }

  function showNextHeroSlide() {
    setHeroSlide((current) => (current + 1) % heroSlides.length);
  }

  function updateHeroCursor(event: MouseEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - bounds.left;
    const y = event.clientY - bounds.top;
    const mode = y > bounds.height * 0.72 ? "down" : x < bounds.width / 2 ? "left" : "right";
    setHeroCursor({ visible: true, x, y, mode });
  }

  function handleHeroPointer(event: MouseEvent<HTMLElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("button,a")) return;
    if (heroCursor.mode === "down") {
      document.getElementById("services")?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    if (heroCursor.mode === "left") showPreviousHeroSlide();
    if (heroCursor.mode === "right") showNextHeroSlide();
  }

  function openBooking(initialService?: string) {
    if (initialService) setService(initialService);
    setStep(1);
    setConfirmed(false);
    setBookingOpen(true);
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
      const nextDay = createCalendarDays(latestBookedTimes).find((day) => !day.disabled);
      if (nextDay) {
        setDate(nextDay.iso);
        setTime(firstAvailableTime(nextDay.iso, latestBookedTimes) ?? times[0]);
      }
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
      }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      if (response.status === 409 && payload?.bookedTimes) {
        setBookedTimes(payload.bookedTimes);
        setStep(2);
        const nextTime = firstAvailableTime(date, payload.bookedTimes);
        if (nextTime) setTime(nextTime);
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

  function mapApiService(item: ApiService): Service {
    return {
      id: item.id,
      name: item.name,
      category: item.category,
      price: formatNaira(item.priceNaira),
      priceNaira: item.priceNaira,
      duration: formatDuration(item.durationMinutes),
      durationMinutes: item.durationMinutes,
      image: item.imageUrl,
    };
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

  function chooseDate(day: { iso: string; disabled: boolean }) {
    if (day.disabled) return;
    setBookingError("");
    setDate(day.iso);
    const nextTime = times.find((item) => !bookedTimes[day.iso]?.includes(item));
    if (nextTime) setTime(nextTime);
  }

  return (
    <main>
      <header className={headerScrolled ? "site-header scrolled" : "site-header"}>
        <a href="#top" className="logo-wrap" aria-label="Sheer Elegance home">
          <img src="/sheer-elegance-logo.png" alt="Oreoluwa Sheer Elegance" />
        </a>
        <nav className={menuOpen ? "nav-links open" : "nav-links"} aria-label="Main navigation">
          <a href="#top" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="#services" onClick={() => setMenuOpen(false)}>Services</a>
          <a href="#gallery" onClick={() => setMenuOpen(false)}>Our work</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
        </nav>
        <button className="header-book" onClick={() => openBooking()}>Book now</button>
        <button className="menu-button" aria-label="Toggle menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button>
      </header>

      <section className="hero" id="top" onMouseMove={updateHeroCursor} onMouseLeave={() => setHeroCursor((current) => ({ ...current, visible: false }))} onClick={handleHeroPointer}>
        <div className="hero-slider" aria-hidden="true">
          {heroSlides.map((slide, index) => (
            <div className={index === heroSlide ? "hero-slide active" : "hero-slide"} style={{ backgroundImage: `url("${slide.image}")` }} key={slide.image} />
          ))}
        </div>
        <div className="hero-shade" />
        <div className="hero-content reveal">
          <div className="hero-slide-copy" key={heroSlide}>
            <p className="eyebrow hero-accent">{activeHero.accent}</p>
            <h1 className="hero-title">
              <span>{activeHero.title}</span>
              <span><em className="script-word">{activeHero.highlight}</em></span>
            </h1>
            <p className="hero-copy">{activeHero.copy}</p>
          </div>
          <div className="hero-actions">
            <button className="button gold" onClick={() => openBooking()}>Book an appointment <span>↗</span></button>
            <a className="text-link" href="#services">Explore services <span>↓</span></a>
          </div>
        </div>
        <div className="hero-index"><span>01</span><i /><span>05</span></div>
        <div className={heroCursor.visible ? "hero-cursor visible" : "hero-cursor"} style={{ left: heroCursor.x, top: heroCursor.y }} aria-hidden="true">
          {heroCursor.mode === "left" ? "<" : heroCursor.mode === "down" ? "↓" : ">"}
        </div>
      </section>

      <section className="quick-book" aria-label="Quick booking" data-animate>
        <div><span>01</span><p>Choose a service</p><strong>{service}</strong></div>
        <div><span>02</span><p>Select a date</p><strong>{date}</strong></div>
        <div><span>03</span><p>Find your moment</p><strong>{time}</strong></div>
        <button onClick={() => openBooking()}>Check availability <span>↗</span></button>
      </section>

      <section className="section services" id="services" data-animate>
        <div className="section-heading">
          <div><p className="eyebrow dark">Salon menu</p><h2>Hair care made for<br /><em className="script-word">real life.</em></h2></div>
          <p>Choose from silk press, Ghana weaving, knotless braids, lace frontal installs, relaxer retouching, bridal styling and treatment plans designed for humid weather and textured hair.</p>
        </div>
        <div className="service-grid">
          {availableServices.map((item, index) => (
            <article className="service-card" key={item.name}>
              <div className="service-image"><img src={item.image} alt={`${item.name} hairstyle`} loading="lazy" /><span>0{index + 1}</span></div>
              <div className="service-info"><div><p>{item.category} - {item.duration}</p><h3>{item.name}</h3></div><div><strong>From {item.price}</strong><button aria-label={`Book ${item.name}`} onClick={() => openBooking(item.name)}>↗</button></div></div>
            </article>
          ))}
        </div>
      </section>

      <section className="come-as-you-are parallax-panel" style={{ "--scroll-y": scrollY } as CSSProperties} data-animate>
        <div className="contact-copy parallax-content">
          <h2>Come as you are</h2>
          <p className="contact-lead">Book a chair for a thoughtful consultation, healthy styling, silk press, colour refresh, protective install or restorative treatment tailored to your hair.</p>
          <button className="read-more-button" onClick={() => openBooking()}>Reserve your chair</button>
        </div>
        <div className="contact-collage parallax-content" aria-label="Sheer Elegance salon moments">
          <img className="collage-left" src="https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=620&q=80" alt="Client in salon chair during a styling appointment" loading="lazy" />
          <img className="collage-front" src="https://images.unsplash.com/photo-1620331311520-246422fd82f9?auto=format&fit=crop&w=680&q=80" alt="Hair stylist finishing a salon look" loading="lazy" />
        </div>
      </section>

      <section className="about-us" id="about" data-animate>
        <div className="about-intro">
          <p className="eyebrow dark">About us</p>
          <h2>Luxury hair care with a calm, personal rhythm.</h2>
        </div>
        <div className="about-story">
          <p>Sheer Elegance is a Lagos hair studio for clients who want beauty that still protects the health of their hair. Every appointment begins with listening: your texture, your routine, your event, your comfort, and the finish you want to live with after you leave the chair.</p>
          <div className="about-points">
            <span>Texture-aware styling</span>
            <span>Private consultations</span>
            <span>Healthy colour and treatments</span>
          </div>
        </div>
      </section>

      <section className="manifesto" data-animate>
        <p className="eyebrow">The Sheer Elegance way</p>
        <h2>Your hair is not a trend.<br />It is a <em className="script-word">story.</em></h2>
        <p>We pair technical expertise with thoughtful consultation, protecting the health of your hair while creating a look that belongs wholly to you.</p>
        <div className="manifesto-stats"><div><strong>8+</strong><span>Years of artistry</span></div><div><strong>2.4k</strong><span>Beautiful clients</span></div><div><strong>96%</strong><span>Return to our chair</span></div></div>
      </section>

      <section className="gallery" id="gallery" data-animate>
        <div className="gallery-title"><p className="eyebrow dark">Fresh from the chair</p><h2>Made to be<br /><em className="script-word">remembered.</em></h2></div>
        <div className="gallery-grid">
          <figure className="gallery-main"><img src="https://mindbodygreen-res.cloudinary.com/image/upload/c_crop,x_0,y_684,w_2800,h_1867/c_fill,w_1200,h_800,g_auto,q_90,fl_lossy,f_jpg/org/34g2cg7qikmavaytp.jpg" alt="Natural afro hairstyle" loading="lazy" /><figcaption><span>Natural texture</span><strong>The Halo</strong></figcaption></figure>
          <figure><img src="https://i.pinimg.com/originals/be/85/eb/be85eb8fb718f89a6fdc2460d604bd9f.png" alt="Editorial natural hairstyle" loading="lazy" /><figcaption><span>Editorial</span><strong>Soft Sculpture</strong></figcaption></figure>
          <figure><img src="https://cdn.shopify.com/s/files/1/0532/0546/7332/t/9/assets/brow-code_entry-page_retail_785x.jpg?v=96118312172429472841647824823" alt="Natural hair beauty portrait" loading="lazy" /><figcaption><span>Silk finish</span><strong>Golden Hour</strong></figcaption></figure>
        </div>
      </section>

      <section className="testimonial" data-animate>
        <div className="testimonial-inner">
          <span className="quote">”</span>
          <h2>Testimonials</h2>
          <div className="testimonial-slide" key={activeTestimonial.name}>
            <blockquote>{activeTestimonial.quote}</blockquote>
            <p>{activeTestimonial.name} - {activeTestimonial.detail}</p>
          </div>
          <div className="testimonial-dots">{testimonials.map((item, index) => <button key={item.name} className={index === testimonialIndex ? "active" : ""} aria-label={`Show testimonial from ${item.name}`} onClick={() => setTestimonialIndex(index)} />)}</div>
        </div>
      </section>

      <section className="contact-us" id="contact" data-animate>
        <div>
          <p className="eyebrow dark">Contact us</p>
          <h2>Ready for your next appointment?</h2>
          <p>Visit us in Lekki Phase 1 or send a message to plan your silk press, colour service, protective style or restorative treatment.</p>
        </div>
        <div className="contact-us-details">
          <article><span>Visit</span><p>14 Admiralty Way<br />Lekki Phase 1, Lagos</p></article>
          <article><span>Opening hours</span><p>Tue-Fri - 9am-7pm<br />Sat - 8am-6pm</p></article>
          <article><span>Talk to us</span><p>+234 810 000 2026<br />hello@sheerelegance.ng</p></article>
          <button className="button gold" onClick={() => openBooking()}>Book an appointment <span>↗</span></button>
        </div>
      </section>

      <footer><div className="footer-logo"><img src="/sheer-elegance-logo.png" alt="Oreoluwa Sheer Elegance" /></div><p>Hair, handled beautifully.</p><div className="footer-links"><a href="#services">Services</a><a href="#gallery">Our work</a><a href="#contact">Instagram</a><a href="#contact">WhatsApp</a></div><div className="footer-bottom"><span>© 2026 Sheer Elegance</span><span>Privacy - Booking policy</span></div></footer>

      {bookingOpen && <div className="booking-overlay" role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <button className="booking-backdrop" aria-label="Close booking" onClick={() => setBookingOpen(false)} />
        <div className="booking-panel">
          <div className="booking-top"><div><p>Sheer Elegance</p><h2 id="booking-title">Book your appointment</h2></div><button onClick={() => setBookingOpen(false)} aria-label="Close booking">x</button></div>
          {!confirmed ? <>
            <div className="stepper">{[1,2,3,4].map((n) => <span key={n} className={step >= n ? "active" : ""}>{n}</span>)}</div>
            {step === 1 && <div className="booking-step"><p className="step-label">01 - Choose your service</p><div className="option-list">{availableServices.map((item) => <button key={item.name} className={service === item.name ? "selected" : ""} onClick={() => setService(item.name)}><span><b>{item.name}</b><small>{item.category} - {item.duration}</small></span><strong>{item.price}</strong></button>)}</div></div>}
            {step === 2 && <div className="booking-step"><p className="step-label">02 - Select a date and time</p><div className="calendar-grid">{calendarDays.map((day) => <button key={day.iso} disabled={day.disabled} className={date === day.iso ? "selected" : ""} onClick={() => chooseDate(day)}><span>{day.weekday}</span><strong>{day.day}</strong></button>)}</div><div className="time-grid">{times.map((item) => <button key={item} disabled={bookedTimes[date]?.includes(item)} className={time === item ? "selected" : ""} onClick={() => { setBookingError(""); setTime(item); }}>{item}</button>)}</div>{availableTimes.length === 0 && <p className="admin-error">This day is fully booked. Please choose another date.</p>}{bookingError && <p className="admin-error">{bookingError}</p>}</div>}
            {step === 3 && <form className="booking-step details-form" id="details-form" onSubmit={(e) => { e.preventDefault(); setStep(4); }}><p className="step-label">03 - Your details</p><label>Full name<input required value={details.name} onChange={(e) => setDetails({...details, name:e.target.value})} placeholder="Ada Okafor" /></label><label>Phone number<input required type="tel" value={details.phone} onChange={(e) => setDetails({...details, phone:e.target.value})} placeholder="+234 800 000 0000" /></label><label>Email address<input required type="email" value={details.email} onChange={(e) => setDetails({...details, email:e.target.value})} placeholder="you@example.com" /></label></form>}
            {step === 4 && <form className="booking-step summary" onSubmit={submitBooking}><p className="step-label">04 - Payment and confirmation</p><div><span>Service</span><strong>{selectedService.name}</strong></div><div><span>When</span><strong>{date} - {time}</strong></div><div><span>Total</span><strong>{selectedService.price}</strong></div><div className="payment-options"><button type="button" className={paymentOption === "deposit" ? "selected" : ""} onClick={() => setPaymentOption("deposit")}><span>Deposit</span><strong>NGN 10,000</strong></button><button type="button" className={paymentOption === "half" ? "selected" : ""} onClick={() => setPaymentOption("half")}><span>50%</span><strong>{formatNaira(Math.ceil(selectedService.priceNaira / 2))}</strong></button><button type="button" className={paymentOption === "full" ? "selected" : ""} onClick={() => setPaymentOption("full")}><span>Full payment</span><strong>{selectedService.price}</strong></button><button type="button" className={paymentOption === "pay_on_arrival" ? "selected" : ""} onClick={() => setPaymentOption("pay_on_arrival")}><span>Pay at salon</span><strong>Later</strong></button></div><p>{paymentOption === "pay_on_arrival" ? "Your appointment request will be saved without online payment." : `${formatNaira(paymentAmount)} will be paid securely through Monnify.`}</p>{bookingError && <p className="admin-error">{bookingError}</p>}<button className="button gold" type="submit">{paymentOption === "pay_on_arrival" ? "Confirm appointment" : "Continue to payment"}</button></form>}
            {step < 4 && <div className="booking-actions"><button disabled={step === 1} onClick={() => setStep(step - 1)}>Back</button><button className="next" type={step === 3 ? "submit" : "button"} form={step === 3 ? "details-form" : undefined} disabled={step === 2 && availableTimes.length === 0} onClick={step === 3 ? undefined : () => setStep(step + 1)}>Continue <span>↗</span></button></div>}
          </> : <div className="confirmation"><span>✓</span><p>Appointment request received</p><h2>We'll see you soon, {details.name.split(" ")[0]}.</h2><div><strong>{selectedService.name}</strong><p>{date} at {time}</p></div><button className="button gold" onClick={() => setBookingOpen(false)}>Back to the website</button></div>}
        </div>
      </div>}
    </main>
  );
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

function paymentAmountFor(
  option: "deposit" | "half" | "full" | "pay_on_arrival",
  priceNaira: number,
) {
  if (option === "deposit") return 10000;
  if (option === "half") return Math.ceil(priceNaira / 2);
  if (option === "full") return priceNaira;
  return 0;
}
