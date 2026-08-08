"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const services = [
  { name: "Silk press", category: "Styling", price: "₦25,000", duration: "2 hrs", image: "https://media.stylist.co.uk/app/uploads/2023/09/14164104/black-woman-hair-crop-1694706100-877x1316.jpg" },
  { name: "Knotless braids", category: "Protective", price: "₦45,000", duration: "4 hrs", image: "https://i.pinimg.com/originals/05/01/e6/0501e6f78b433772fe9a13c391450b74.jpg" },
  { name: "Signature colour", category: "Colour", price: "₦38,000", duration: "3 hrs", image: "https://media.voguebusiness.com/photos/640b52514c264c5cc89d147b/2:3/w_2560,c_limit/article-name-voguebus-photographer-month-22-story.jpg" },
  { name: "Restorative ritual", category: "Treatment", price: "₦18,000", duration: "90 min", image: "https://images.squarespace-cdn.com/content/v1/641b331ca868034c727264d6/1bbbb150-3b97-4192-801e-7b64a5de314b/Halo%2BEffect_2.jpg" },
];

const stylists = [
  { name: "Amara Okafor", role: "Creative Director", specialty: "Colour & silk press", initials: "AO" },
  { name: "Zainab Bello", role: "Senior Stylist", specialty: "Braids & natural hair", initials: "ZB" },
  { name: "Teni Adeyemi", role: "Hair Therapist", specialty: "Treatments & scalp care", initials: "TA" },
];

const dates = ["Tue 11", "Wed 12", "Thu 13", "Fri 14", "Sat 15"];
const times = ["9:00 AM", "10:30 AM", "12:00 PM", "2:30 PM", "4:00 PM", "5:30 PM"];

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [service, setService] = useState(services[0].name);
  const [stylist, setStylist] = useState("Any available stylist");
  const [date, setDate] = useState(dates[1]);
  const [time, setTime] = useState(times[1]);
  const [details, setDetails] = useState({ name: "", phone: "", email: "" });
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    document.body.style.overflow = bookingOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [bookingOpen]);

  const selectedService = useMemo(() => services.find((item) => item.name === service) ?? services[0], [service]);

  function openBooking(initialService?: string) {
    if (initialService) setService(initialService);
    setStep(1);
    setConfirmed(false);
    setBookingOpen(true);
  }

  function submitBooking(event: FormEvent) {
    event.preventDefault();
    if (!details.name || !details.phone || !details.email) return;
    setConfirmed(true);
  }

  return (
    <main>
      <header className="site-header">
        <a href="#top" className="logo-wrap" aria-label="Sheer Elegance home">
          <img src="/sheer-elegance-logo.png" alt="Oreoluwa Sheer Elegance" />
        </a>
        <nav className={menuOpen ? "nav-links open" : "nav-links"} aria-label="Main navigation">
          <a href="#services" onClick={() => setMenuOpen(false)}>Services</a>
          <a href="#gallery" onClick={() => setMenuOpen(false)}>Our work</a>
          <a href="#stylists" onClick={() => setMenuOpen(false)}>Stylists</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>About</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>Contact</a>
        </nav>
        <button className="header-book" onClick={() => openBooking()}>Book now</button>
        <button className="menu-button" aria-label="Toggle menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button>
      </header>

      <section className="hero" id="top">
        <div className="hero-shade" />
        <div className="hero-content reveal">
          <p className="eyebrow">Lagos · Hair artistry · Since 2016</p>
          <h1>Beauty, crafted<br /><em>with intention.</em></h1>
          <p className="hero-copy">Healthy hair, considered styling and an experience designed entirely around you.</p>
          <div className="hero-actions">
            <button className="button gold" onClick={() => openBooking()}>Book an appointment <span>↗</span></button>
            <a className="text-link" href="#services">Explore services <span>↓</span></a>
          </div>
        </div>
        <div className="hero-index"><span>01</span><i /><span>05</span></div>
      </section>

      <section className="quick-book" aria-label="Quick booking">
        <div><span>01</span><p>Choose a service</p><strong>{service}</strong></div>
        <div><span>02</span><p>Select a date</p><strong>{date}</strong></div>
        <div><span>03</span><p>Find your moment</p><strong>{time}</strong></div>
        <button onClick={() => openBooking()}>Check availability <span>→</span></button>
      </section>

      <section className="section services" id="services">
        <div className="section-heading">
          <div><p className="eyebrow dark">Our signatures</p><h2>Care for every<br /><em>expression.</em></h2></div>
          <p>From protective styles to transformative colour, every appointment begins with listening and ends with hair that feels as beautiful as it looks.</p>
        </div>
        <div className="service-grid">
          {services.map((item, index) => (
            <article className="service-card" key={item.name}>
              <div className="service-image"><img src={item.image} alt={`${item.name} hairstyle`} loading="lazy" /><span>0{index + 1}</span></div>
              <div className="service-info"><div><p>{item.category} · {item.duration}</p><h3>{item.name}</h3></div><div><strong>From {item.price}</strong><button aria-label={`Book ${item.name}`} onClick={() => openBooking(item.name)}>↗</button></div></div>
            </article>
          ))}
        </div>
      </section>

      <section className="manifesto" id="about">
        <p className="eyebrow">The Sheer Elegance way</p>
        <h2>Your hair is not a trend.<br />It is a <em>story.</em></h2>
        <p>We pair technical expertise with thoughtful consultation, protecting the health of your hair while creating a look that belongs wholly to you.</p>
        <div className="manifesto-stats"><div><strong>8+</strong><span>Years of artistry</span></div><div><strong>2.4k</strong><span>Beautiful clients</span></div><div><strong>96%</strong><span>Return to our chair</span></div></div>
      </section>

      <section className="gallery" id="gallery">
        <div className="gallery-title"><p className="eyebrow dark">Fresh from the chair</p><h2>Made to be<br /><em>remembered.</em></h2></div>
        <div className="gallery-grid">
          <figure className="gallery-main"><img src="https://mindbodygreen-res.cloudinary.com/image/upload/c_crop,x_0,y_684,w_2800,h_1867/c_fill,w_1200,h_800,g_auto,q_90,fl_lossy,f_jpg/org/34g2cg7qikmavaytp.jpg" alt="Natural afro hairstyle" loading="lazy" /><figcaption><span>Natural texture</span><strong>The Halo</strong></figcaption></figure>
          <figure><img src="https://i.pinimg.com/originals/be/85/eb/be85eb8fb718f89a6fdc2460d604bd9f.png" alt="Editorial natural hairstyle" loading="lazy" /><figcaption><span>Editorial</span><strong>Soft Sculpture</strong></figcaption></figure>
          <figure><img src="https://cdn.shopify.com/s/files/1/0532/0546/7332/t/9/assets/brow-code_entry-page_retail_785x.jpg?v=96118312172429472841647824823" alt="Natural hair beauty portrait" loading="lazy" /><figcaption><span>Silk finish</span><strong>Golden Hour</strong></figcaption></figure>
        </div>
      </section>

      <section className="section team" id="stylists">
        <div className="section-heading compact"><div><p className="eyebrow dark">Hands behind the magic</p><h2>Meet your<br /><em>artist.</em></h2></div><p>Specialists who listen closely, work thoughtfully and celebrate every texture.</p></div>
        <div className="team-grid">{stylists.map((person) => <article key={person.name}><div className="portrait-placeholder"><span>{person.initials}</span></div><p>{person.role}</p><h3>{person.name}</h3><span>{person.specialty}</span><button onClick={() => { setStylist(person.name); openBooking(); }}>Book with {person.name.split(" ")[0]} <b>→</b></button></article>)}</div>
      </section>

      <section className="testimonial">
        <span className="quote">“</span><blockquote>From the consultation to the final reveal, I felt completely seen. My hair has never looked—or felt—this healthy.</blockquote><p>— Adaeze N. · Silk press client</p>
      </section>

      <section className="contact" id="contact">
        <div className="contact-image"><img src="https://groomie.in/salon_interior_dark.png" alt="Sheer Elegance salon interior" loading="lazy" /></div>
        <div className="contact-copy"><p className="eyebrow">Come as you are</p><h2>Your chair<br /><em>is waiting.</em></h2><div className="contact-details"><div><span>Visit</span><p>14 Admiralty Way<br />Lekki Phase 1, Lagos</p></div><div><span>Opening hours</span><p>Tue–Fri · 9am–7pm<br />Sat · 8am–6pm</p></div><div><span>Talk to us</span><p>+234 810 000 2026<br />hello@sheerelegance.ng</p></div></div><button className="button gold" onClick={() => openBooking()}>Reserve your chair <span>↗</span></button></div>
      </section>

      <footer><div className="footer-logo"><img src="/sheer-elegance-logo.png" alt="Oreoluwa Sheer Elegance" /></div><p>Hair, handled beautifully.</p><div className="footer-links"><a href="#services">Services</a><a href="#gallery">Our work</a><a href="#contact">Instagram</a><a href="#contact">WhatsApp</a></div><div className="footer-bottom"><span>© 2026 Sheer Elegance</span><span>Privacy · Booking policy</span></div></footer>

      {bookingOpen && <div className="booking-overlay" role="dialog" aria-modal="true" aria-labelledby="booking-title">
        <button className="booking-backdrop" aria-label="Close booking" onClick={() => setBookingOpen(false)} />
        <div className="booking-panel">
          <div className="booking-top"><div><p>Sheer Elegance</p><h2 id="booking-title">Book your appointment</h2></div><button onClick={() => setBookingOpen(false)} aria-label="Close booking">×</button></div>
          {!confirmed ? <>
            <div className="stepper">{[1,2,3,4,5].map((n) => <span key={n} className={step >= n ? "active" : ""}>{n}</span>)}</div>
            {step === 1 && <div className="booking-step"><p className="step-label">01 · Choose your service</p><div className="option-list">{services.map((item) => <button key={item.name} className={service === item.name ? "selected" : ""} onClick={() => setService(item.name)}><span><b>{item.name}</b><small>{item.category} · {item.duration}</small></span><strong>{item.price}</strong></button>)}</div></div>}
            {step === 2 && <div className="booking-step"><p className="step-label">02 · Choose your stylist</p><div className="option-list stylist-options"><button className={stylist === "Any available stylist" ? "selected" : ""} onClick={() => setStylist("Any available stylist")}><span><b>Any available stylist</b><small>Show me the earliest appointment</small></span><strong>Recommended</strong></button>{stylists.map((item) => <button key={item.name} className={stylist === item.name ? "selected" : ""} onClick={() => setStylist(item.name)}><span><b>{item.name}</b><small>{item.specialty}</small></span></button>)}</div></div>}
            {step === 3 && <div className="booking-step"><p className="step-label">03 · Select a date & time</p><div className="date-grid">{dates.map((item) => <button key={item} className={date === item ? "selected" : ""} onClick={() => setDate(item)}>{item}</button>)}</div><div className="time-grid">{times.map((item) => <button key={item} className={time === item ? "selected" : ""} onClick={() => setTime(item)}>{item}</button>)}</div></div>}
            {step === 4 && <form className="booking-step details-form" id="details-form" onSubmit={(e) => { e.preventDefault(); setStep(5); }}><p className="step-label">04 · Your details</p><label>Full name<input required value={details.name} onChange={(e) => setDetails({...details, name:e.target.value})} placeholder="Ada Okafor" /></label><label>Phone number<input required type="tel" value={details.phone} onChange={(e) => setDetails({...details, phone:e.target.value})} placeholder="+234 800 000 0000" /></label><label>Email address<input required type="email" value={details.email} onChange={(e) => setDetails({...details, email:e.target.value})} placeholder="you@example.com" /></label></form>}
            {step === 5 && <form className="booking-step summary" onSubmit={submitBooking}><p className="step-label">05 · Review & confirm</p><div><span>Service</span><strong>{selectedService.name}</strong></div><div><span>Stylist</span><strong>{stylist}</strong></div><div><span>When</span><strong>{date} · {time}</strong></div><div><span>Estimated total</span><strong>{selectedService.price}</strong></div><p>A ₦10,000 deposit will secure your appointment. This prototype does not collect payment.</p><button className="button gold" type="submit">Confirm appointment</button></form>}
            {step < 5 && <div className="booking-actions"><button disabled={step === 1} onClick={() => setStep(step - 1)}>Back</button><button className="next" type={step === 4 ? "submit" : "button"} form={step === 4 ? "details-form" : undefined} onClick={step === 4 ? undefined : () => setStep(step + 1)}>Continue <span>→</span></button></div>}
          </> : <div className="confirmation"><span>✓</span><p>Appointment request received</p><h2>We’ll see you soon, {details.name.split(" ")[0]}.</h2><div><strong>{selectedService.name}</strong><p>{date} at {time}<br />with {stylist}</p></div><button className="button gold" onClick={() => setBookingOpen(false)}>Back to the website</button></div>}
        </div>
      </div>}
    </main>
  );
}
