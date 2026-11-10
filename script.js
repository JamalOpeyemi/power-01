// POWER Personal Training: landing page interactions
(function () {
  const WHATSAPP_NUMBER = "60175861619"; // 017-586 1619 in international format

  // Footer year
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Header background on scroll + mobile sticky CTA
  const header = document.querySelector(".site-header");
  const mobileCta = document.querySelector(".mobile-cta");
  const bookSection = document.getElementById("book");

  function onScroll() {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 40);

    if (mobileCta && bookSection) {
      const bookTop = bookSection.getBoundingClientRect().top;
      const pastHero = y > window.innerHeight * 0.7;
      const beforeBooking = bookTop > window.innerHeight * 0.5;
      mobileCta.classList.toggle("is-visible", pastHero && beforeBooking);
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile navigation
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("main-nav");

  function setNav(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  toggle.addEventListener("click", () => setNav(!nav.classList.contains("is-open")));
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setNav(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setNav(false); });

  // Reveal on scroll
  const revealTargets = document.querySelectorAll(
    ".section-head, .programme-card, .trainer-card, .transform-card, .review-summary, .testimonial, .why-item, .steps li, .book-form, .location, .section-cta"
  );
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    revealTargets.forEach((el, i) => {
      el.classList.add("reveal");
      el.style.transitionDelay = `${(i % 4) * 70}ms`;
      io.observe(el);
    });
  }

  // Booking form: opens WhatsApp with a pre-filled message.
  // Swap this for a form service / booking system later if preferred.
  const form = document.getElementById("book-form");
  const error = document.getElementById("form-error");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const goal = form.goal.value;
    const time = form.time.value;
    const message = form.message.value.trim();

    const missing = [];
    [["name", name], ["phone", phone], ["goal", goal]].forEach(([field, val]) => {
      form[field].classList.toggle("is-invalid", !val);
      if (!val) missing.push(field);
    });

    if (missing.length) {
      error.hidden = false;
      form[missing[0]].focus();
      return;
    }
    error.hidden = true;

    const lines = [
      "Hi POWER! I'd like to book a free consultation.",
      "",
      `Name: ${name}`,
      `Phone: ${phone}`,
      `Goal: ${goal}`,
      `Preferred time: ${time}`,
    ];
    if (message) lines.push(`Notes: ${message}`);

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`;
    window.open(url, "_blank", "noopener");
  });
})();
