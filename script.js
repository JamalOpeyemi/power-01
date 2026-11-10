// POWER Personal Training: landing page interactions
(function () {
  const WHATSAPP_NUMBER = "60175861619"; // 017-586 1619 in international format

  // Footer year
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Header: solid background once you scroll past the top
  const header = document.querySelector(".site-header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Mobile menu
  const menuBtn = document.getElementById("menu-btn");
  const menu = document.getElementById("menu");
  function setMenu(open) {
    menu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.textContent = open ? "Close" : "Menu";
    header.classList.toggle("menu-open", open);
    document.body.style.overflow = open ? "hidden" : "";
  }
  menuBtn.addEventListener("click", () => setMenu(menu.hidden));
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) setMenu(false); });

  // Reveal on scroll
  const items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach((el) => {
      // stagger siblings slightly
      const siblings = Array.from(el.parentElement.children).filter((c) => c.classList.contains("reveal"));
      el.style.transitionDelay = `${Math.min(siblings.indexOf(el), 5) * 70}ms`;
      io.observe(el);
    });
  } else {
    items.forEach((el) => el.classList.add("is-in"));
  }

  // Booking form (book.html only) → opens WhatsApp with a pre-filled message
  const form = document.getElementById("book-form");
  const error = document.getElementById("form-error");
  if (form) form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      goal: form.goal.value,
      time: form.time.value,
      message: form.message.value.trim(),
    };

    const missing = ["name", "phone", "goal"].filter((k) => !data[k]);
    ["name", "phone", "goal"].forEach((k) => form[k].closest(".field").classList.toggle("is-invalid", missing.includes(k)));
    if (missing.length) {
      error.hidden = false;
      form[missing[0]].focus();
      return;
    }
    error.hidden = true;

    const lines = [
      "Hi POWER! I'd like to book a free consultation.",
      "",
      `Name: ${data.name}`,
      `Phone: ${data.phone}`,
      `Goal: ${data.goal}`,
      `Preferred time: ${data.time}`,
    ];
    if (data.message) lines.push(`Notes: ${data.message}`);
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank", "noopener");
  });
})();

// Hero scroll animation: scrolling plays the band row (landscape screens only)
(function () {
  const wrap = document.getElementById("hero-scroll");
  const canvas = document.getElementById("hero-canvas");
  if (!wrap || !canvas) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const portrait = window.matchMedia("(max-aspect-ratio: 4/5)");
  if (reduce || portrait.matches) return;

  const FRAME_COUNT = 57;
  const path = (i) => `assets/hero-frames/frame_${String(i + 1).padStart(3, "0")}.webp`;
  const FOCUS_X = 0.55, FOCUS_Y = 0.45;   // same as the still image's object-position
  const EASE = 0.16;                        // lower = silkier, higher = snappier

  const hero = wrap.querySelector(".hero");
  const ctx = canvas.getContext("2d");
  const frames = new Array(FRAME_COUNT);
  let target = 0, current = 0, drawn = -1, ticking = false;

  const isLoaded = (img) => img && img.complete && img.naturalWidth;
  function load(i) {
    const img = new Image();
    img.decoding = "async";
    img.src = path(i);
    img.onload = () => { if (Math.round(current) === i) request(true); };
    frames[i] = img;
  }
  load(0);
  frames[0].onload = () => { request(true); for (let i = 1; i < FRAME_COUNT; i++) load(i); };

  function nearest(i) {
    for (let d = 0; d < FRAME_COUNT; d++) {
      if (isLoaded(frames[i - d])) return frames[i - d];
      if (isLoaded(frames[i + d])) return frames[i + d];
    }
    return null;
  }

  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(hero.clientWidth * dpr);
    canvas.height = Math.round(hero.clientHeight * dpr);
    request(true);
  }

  function draw(i) {
    const img = nearest(i);
    if (!img) return false;
    const cw = canvas.width, ch = canvas.height, iw = img.naturalWidth, ih = img.naturalHeight;
    const scale = Math.max(cw / iw, ch / ih);          // cover
    const dw = iw * scale, dh = ih * scale;
    ctx.drawImage(img, (cw - dw) * FOCUS_X, (ch - dh) * FOCUS_Y, dw, dh);
    canvas.classList.add("is-ready");
    return isLoaded(frames[i]);
  }

  function progress() {
    const distance = wrap.offsetHeight - hero.offsetHeight;
    return distance > 0 ? Math.min(1, Math.max(0, -wrap.getBoundingClientRect().top / distance)) : 0;
  }

  function onScroll() {
    const p = progress();
    hero.style.setProperty("--progress", p.toFixed(3));
    target = p * (FRAME_COUNT - 1);
    request();
  }

  function request(force) {
    if (force) drawn = -1;
    if (!ticking) { ticking = true; requestAnimationFrame(tick); }
  }

  function tick() {
    ticking = false;
    current += (target - current) * EASE;
    if (Math.abs(target - current) < 0.01) current = target;
    const i = Math.round(current);
    if (i !== drawn && draw(i)) drawn = i;
    if (current !== target) request();   // a frame still loading redraws from its onload
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", size);
  portrait.addEventListener("change", () => location.reload());
  size();
  onScroll();
})();
