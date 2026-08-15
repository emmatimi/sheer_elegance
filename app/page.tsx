"use client";

import { CSSProperties, FormEvent, MouseEvent, useEffect, useMemo, useState } from "react";
import { FaWhatsapp, FaInstagram, FaTiktok } from "react-icons/fa6";

const services = [
  { id: 1, name: "Silk press and trim", category: "Natural hair", price: "NGN 30,000", priceNaira: 30000, duration: "2 hrs", durationMinutes: 120, image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=900&q=85", shortDescription: "silk press, blow-dry and straightening, curls, waves and sleek styling" },
  { id: 2, name: "Boho knotless braids", category: "Protective styling", price: "NGN 65,000", priceNaira: 65000, duration: "5 hrs", durationMinutes: 300, image: "https://images.unsplash.com/photo-1605980776566-0486c3ac7617?auto=format&fit=crop&w=900&q=85", shortDescription: "knotless braids, box braids, bohemian braids, twists and protective braids" },
  { id: 3, name: "Frontal wig install", category: "Wigs and lace", price: "NGN 45,000", priceNaira: 45000, duration: "2 hrs 30 min", durationMinutes: 150, image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=85", shortDescription: "wig installation, frontal installation, closure installation, lace melting" },
  { id: 4, name: "Ghana weaving cornrows", category: "Braids", price: "NGN 25,000", priceNaira: 25000, duration: "2 hrs 30 min", durationMinutes: 150, image: "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=900&q=85", shortDescription: "cornrows, Ghana weaving, stitch braids, feed-in braids" },
  { id: 5, name: "Relaxer retouch and treatment", category: "Hair care", price: "NGN 28,000", priceNaira: 28000, duration: "2 hrs", durationMinutes: 120, image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=900&q=85", shortDescription: "washing, conditioning, treatments, trimming and scalp care" },
  { id: 6, name: "Bridal hair styling", category: "Events", price: "NGN 120,000", priceNaira: 120000, duration: "Consultation", durationMinutes: 0, image: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=900&q=85", shortDescription: "bridal updos, bridesmaid hairstyles, formal styling and accessories" },
];

type Service = (typeof services)[number];

type ApiService = {
  id: number;
  name: string;
  category: string;
  priceNaira: number;
  durationMinutes: number;
  imageUrl: string;
  shortDescription: string;
};

type Hairstyle = {
  id: number;
  name: string;
  category: string;
  imageUrl: string;
  description: string;
  tags: string[];
};
type ManualReference = { imageUrl: string; fileName: string } | null;

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
  const [paymentOption] = useState<"deposit" | "half" | "full" | "pay_on_arrival">("pay_on_arrival");
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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

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
    fetch("/api/hairstyles")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((payload: { hairstyles?: Hairstyle[] }) => {
        if (!active) return;
        const nextHairstyles = payload.hairstyles ?? [];
        setHairstyles(nextHairstyles);
        const optionId = Number(new URLSearchParams(window.location.search).get("option") ?? new URLSearchParams(window.location.search).get("hairstyle"));
        const matched = Number.isInteger(optionId) ? nextHairstyles.find((item) => item.id === optionId) : null;
        if (matched) openBooking(undefined, matched);
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
  const optionName = selectedHairstyle?.name ?? manualOptionName.trim();
  const optionDescription = selectedHairstyle?.description ?? "";
  const optionReferenceImage = selectedHairstyle?.imageUrl ?? manualReference?.imageUrl ?? null;
  const availableTimes = times.filter((item) => !bookedTimes[date]?.includes(item));
  const calendarDays = useMemo(() => createCalendarDays(bookedTimes), [bookedTimes]);
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

  function openBooking(initialService?: string, hairstyle?: Hairstyle) {
    if (hairstyle) {
      setSelectedHairstyle(hairstyle);
      setManualOptionName(hairstyle.name);
      setManualReference(null);
      setReferenceError("");
      setReferenceUploading(false);
      const matchedService = bestServiceForHairstyle(hairstyle, availableServices);
      if (matchedService) {
        setService(matchedService.name);
      }
      setStep(1);
    } else {
      if (initialService) {
        setService(initialService);
      }
      setSelectedHairstyle(null);
      setManualOptionName("");
      setManualReference(null);
      setReferenceError("");
      setReferenceUploading(false);
      setStep(1);
    }
    setConfirmed(false);
    setBookingOpen(true);
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
      shortDescription: item.shortDescription,
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
          <a href="/hairstyles" onClick={() => setMenuOpen(false)}>Hairstyles</a>
          <a href="#gallery" onClick={() => setMenuOpen(false)}>Our work</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
        </nav>
        <a className="header-book" href="/book">Book now</a>
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
            <a className="button gold" href="/book">Book an appointment <span aria-hidden="true">&rarr;</span></a>
            <a className="text-link" href="#services">Explore services <span aria-hidden="true">&rarr;</span></a>
          </div>
        </div>
        <div className={heroCursor.visible ? "hero-cursor visible" : "hero-cursor"} style={{ left: heroCursor.x, top: heroCursor.y }} aria-hidden="true">
          {heroCursor.mode === "left" ? "<" : heroCursor.mode === "down" ? "v" : ">"}
        </div>
      </section>

      <section className="hairstyle-promo" data-animate>
        <div>
          <p className="eyebrow dark">Find your look</p>
          <h2>Browse styles before you book.</h2>
          <p>Explore braids, silk press looks, bridal styling and protective inspiration. Pick a hairstyle, book from the gallery, and we’ll attach your chosen reference to your appointment.</p>
          <a className="button gold" href="/hairstyles">Explore hairstyles/Service options <span aria-hidden="true">&rarr;</span></a>
        </div>
        <div className="hairstyle-promo-strip">
          {(hairstyles.length ? hairstyles.slice(0, 3) : availableServices.slice(0, 3).map((item) => ({ id: item.id, name: item.name, imageUrl: item.image, category: item.category }))).map((item) => (
            <figure key={item.id}>
              <img src={item.imageUrl} alt={item.name} loading="lazy" />
              <figcaption>{item.category}</figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section className="quick-book" aria-label="Quick booking" data-animate>
        <div><span>01</span><p>Choose a service</p><strong>{service}</strong></div>
        <div><span>02</span><p>Select a date</p><strong>{date}</strong></div>
        <div><span>03</span><p>Find your moment</p><strong>{time}</strong></div>
        <div className="quick-book-final"><span>04</span><p>Confirm your visit</p><strong>Appointment request</strong></div>
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
              <div className="service-info">
                <div>
                  <h3>{item.name}</h3>
                  <ul className="service-style-list">
                    {toServiceItems(item.shortDescription).map((style) => <li key={style}>{style}</li>)}
                  </ul>
                </div>
                <div><a aria-label={`Book ${item.name}`} href={`/book?category=${encodeURIComponent(item.name)}`}>Book</a></div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="come-as-you-are parallax-panel" style={{ "--scroll-y": scrollY } as CSSProperties} data-animate>
        <div className="contact-copy parallax-content">
          <h2>Come as you are</h2>
          <p className="contact-lead">Book a chair for a thoughtful consultation, healthy styling, silk press, colour refresh, protective install or restorative treatment tailored to your hair.</p>
          <a className="read-more-button" href="/book">Reserve your chair</a>
        </div>
        <div className="contact-collage parallax-content" aria-label="Sheer Elegance salon moments" suppressHydrationWarning>
          {hydrated && (
            <>
              <img className="collage-left" src="https://ik.imagekit.io/4lndq5ke52/sheer_elegance/salon.jpg?auto=format&fit=crop&w=620&q=80" alt="Client in salon chair during a styling appointment" loading="lazy" />
              <img className="collage-front" src="https://ik.imagekit.io/4lndq5ke52/sheer_elegance/equip.jpg?auto=format&fit=crop&w=680&q=80" alt="Hair stylist finishing a salon look" loading="lazy" />
            </>
          )}
        </div>
      </section>

      <section className="about-us" id="about" data-animate>
        <div className="about-intro">
          <p className="eyebrow dark">About us</p>
          <h2>Luxury hair care with a calm, personal rhythm.</h2>
        </div>
        <div className="about-story">
          <p>Sheer Elegance is an hair studio for clients who want beauty that still protects the health of their hair. Every appointment begins with listening: your texture, your routine, your event, your comfort, and the finish you want to live with after you leave the chair.</p>
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
          <figure className="gallery-main"><img src="https://ik.imagekit.io/4lndq5ke52/sheer_elegance/confirm6.png?updatedAt=1786317818552/c_crop,x_0,y_684,w_2800,h_1867/c_fill,w_1200,h_800,g_auto,q_90,fl_lossy,f_jpg/org/34g2cg7qikmavaytp.jpg" alt="Natural afro hairstyle" loading="lazy" /><figcaption><span>Natural texture</span><strong>The Halo</strong></figcaption></figure>
          <figure><img src="https://ik.imagekit.io/4lndq5ke52/sheer_elegance/confirm1.png?" alt="Editorial natural hairstyle" loading="lazy" /><figcaption><span>Editorial</span><strong>Soft Sculpture</strong></figcaption></figure>
          <figure><img src="https://ik.imagekit.io/4lndq5ke52/sheer_elegance/hairstyle_07.png?v=96118312172429472841647824823" alt="Natural hair beauty portrait" loading="lazy" /><figcaption><span>Silk finish</span><strong>Golden Hour</strong></figcaption></figure>
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
          <p>Visit us in Osekita Phase 2 or send a message to plan your silk press, colour service, protective style or restorative treatment.</p>
        </div>
        <div className="contact-us-details">
          <article><span>Visit</span><p>Phase 2<br />Osekita ,Ado Ekiti, Ekiti</p></article>
          <article><span>Opening hours</span><p>Mon-Sat - 9am-7pm<br />Sun - 2pm-7pm</p></article>
          <article><span>Talk to us</span><p>+2347041837013<br />hello@sheerelegance.ng</p></article>
          <a className="button gold contact-us-book-tile" href="/book">Book an appointment <span aria-hidden="true">&rarr;</span></a>
        </div>
      </section>

      <footer><div className="footer-logo"><img src="/sheer-elegance-logo.png" alt="Oreoluwa Sheer Elegance" /></div><p>Hair, handled beautifully.</p><div className="footer-links"><a href="#services">Services</a><a href="#gallery">Our work</a></div><div className="footer-social"><a href="https://wa.me/2347041837013" className="social-whatsapp" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"><FaWhatsapp size={22} /></a><a href="https://instagram.com/sheerelegance" className="social-instagram" target="_blank" rel="noopener noreferrer" aria-label="Follow on Instagram"><FaInstagram size={22} /></a><a href="https://tiktok.com/@sheer_elegance" className="social-tiktok" target="_blank" rel="noopener noreferrer" aria-label="Follow on TikTok"><FaTiktok size={22} /></a></div><div className="footer-bottom"><span>© 2026 Sheer Elegance</span><span>Privacy - Booking policy</span></div></footer>

      {bookingOpen && <div className="booking-overlay" role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <button className="booking-backdrop" aria-label="Close booking" onClick={() => setBookingOpen(false)} />
        <div className="booking-panel">
          <div className="booking-top"><div><p>Sheer Elegance</p><h2 id="booking-title">Book your appointment</h2></div><button onClick={() => setBookingOpen(false)} aria-label="Close booking">x</button></div>
          {!confirmed ? <>
            <div className="stepper">{[1,2,3,4].map((n) => <span key={n} className={step >= n ? "active" : ""}>{n}</span>)}</div>
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
            {step === 3 && <form className="booking-step details-form" id="details-form" onSubmit={(e) => { e.preventDefault(); setStep(4); }}><p className="step-label">03 - Your details</p><label>Full name<input required value={details.name} onChange={(e) => setDetails({...details, name:e.target.value})} placeholder="Ada Okafor" /></label><label>Phone number<input required type="tel" value={details.phone} onChange={(e) => setDetails({...details, phone:e.target.value})} placeholder="+234 800 000 0000" /></label><label>Email address<input required type="email" value={details.email} onChange={(e) => setDetails({...details, email:e.target.value})} placeholder="you@example.com" /></label></form>}
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
              <button className="button gold" type="submit">{paymentOption === "pay_on_arrival" ? "Confirm appointment" : "Continue to payment"}</button>
            </form>}
            {step < 4 && <div className="booking-actions"><button disabled={step === 1} onClick={() => setStep(step - 1)}>Back</button><button className="next" type={step === 3 ? "submit" : "button"} form={step === 3 ? "details-form" : undefined} disabled={(step === 1 && (!optionName || referenceUploading)) || (step === 2 && availableTimes.length === 0)} onClick={step === 3 ? undefined : () => setStep(step + 1)}>Continue <span aria-hidden="true">&rarr;</span></button></div>}
          </> : <div className="confirmation"><span>Done</span><p>Appointment request received</p><h2>We'll see you soon, {details.name.split(" ")[0]}.</h2><div><strong>{optionName || selectedService.name}</strong><p>{date} at {time}</p></div><button className="button gold" onClick={() => setBookingOpen(false)}>Back to the website</button></div>}
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

function toServiceItems(value: string) {
  return value
    .split(/,|\n/)
    .map((item) => item.trim().replace(/\.$/, ""))
    .filter(Boolean);
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
