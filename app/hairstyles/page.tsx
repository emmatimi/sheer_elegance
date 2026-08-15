"use client";

import { CSSProperties, useEffect, useMemo, useState } from "react";

type Hairstyle = {
  id: number;
  name: string;
  category: string;
  imageUrl: string;
  description: string;
  tags: string[];
};

type Service = {
  id: number;
  name: string;
};

export default function HairstylesPage() {
  const [hairstyles, setHairstyles] = useState<Hairstyle[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(false);

  useEffect(() => {
    fetch("/api/hairstyles")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((payload: { hairstyles?: Hairstyle[] }) => setHairstyles(payload.hairstyles ?? []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    fetch("/api/services")
      .then((response) => response.ok ? response.json() : Promise.reject())
      .then((payload: { services?: Service[] }) => setServices(payload.services ?? []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const updateScroll = () => setHeaderScrolled(window.scrollY > 24);
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateScroll);
  }, []);

  const categories = useMemo(() => ["All", ...(services.length ? services.map((item) => item.name) : Array.from(new Set(hairstyles.map((item) => item.category))))], [hairstyles, services]);
  const filtered = hairstyles.filter((item) => {
    const matchesCategory = category === "All" || item.category === category;
    const haystack = `${item.name} ${item.category} ${item.description} ${item.tags.join(" ")}`.toLowerCase();
    return matchesCategory && haystack.includes(query.toLowerCase());
  });

  return (
    <main className="hairstyles-page">
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

      <section className="hairstyles-hero">
        <div className="hairstyles-hero-bg" aria-hidden="true" />
        <div className="hairstyles-hero-shade" aria-hidden="true" />
        <div className="hairstyles-hero-content">
          <p className="eyebrow hero-accent">Style library</p>
          <h1>
            Choose the look
            <em className="script-word"> before the chair.</em>
          </h1>
          <p>Browse hairstyle inspiration, filter by category, and book with your chosen reference attached to the appointment.</p>
        </div>
      </section>

      <section className="hairstyle-filters" aria-label="Hairstyle filters">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search braids, silk press, bridal..." />
        <div>
          {categories.map((item) => (
            <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>
          ))}
        </div>
      </section>

      <section className="hairstyle-library" id="hairstyle-library">
        {filtered.map((item, index) => (
          <article key={item.id} style={{ "--card-index": index } as CSSProperties}>
            <div className="hairstyle-card-image">
              <img src={item.imageUrl} alt={item.name} loading="lazy" />
            </div>
            <div className="hairstyle-card-body">
              <div className="hairstyle-card-kicker">
                <span>{item.category}</span>
              </div>
              <h2>{item.name}</h2>
              <p>{item.description}</p>
              <a className="hairstyle-book-link" href={`/book?option=${item.id}`}>
                <span>Book this look</span>
              </a>
            </div>
          </article>
        ))}
        {!filtered.length && <p>No hairstyles match that filter yet.</p>}
      </section>
    </main>
  );
}


