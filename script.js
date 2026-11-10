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

  // ---- Settings ----
  const FRAME_COUNT = 57;
  const path = (i) => `assets/hero-frames/frame_${String(i + 1).padStart(3, "0")}.webp`;
  const FOCUS_X = 0.55, FOCUS_Y = 0.45;  // same crop as the still image (object-position)
  const MOTION_END = 0.86;               // the pull finishes at 86% of the hero scroll; the headline lands after
  const SMOOTHING_MS = 40;               // how closely it follows your scroll: lower = tighter, higher = softer

  const hero = wrap.querySelector(".hero");
  const title = hero.querySelector(".hero-title");
  const cue = hero.querySelector(".scroll-cue") || document.createElement("div");
  let lastPv = "";
  const ctx = canvas.getContext("2d", { alpha: false });
  const imgs = new Array(FRAME_COUNT);
  const bitmaps = new Array(FRAME_COUNT);   // pre-decoded frames: no decoding while you scroll

  function load(i) {
    const img = new Image();
    img.decoding = "async";
    img.src = path(i);
    img.onload = () => {
      const done = (bm) => { if (bm) bitmaps[i] = bm; dirty = true; kick(); };
      if (window.createImageBitmap) createImageBitmap(img).then(done, () => done());
      else done();
    };
    imgs[i] = img;
  }
  for (let i = 0; i < FRAME_COUNT; i++) load(i);

  const ready = (i) => bitmaps[i] || (imgs[i] && imgs[i].complete && imgs[i].naturalWidth ? imgs[i] : null);
  function nearest(i) {
    for (let d = 0; d < FRAME_COUNT; d++) {
      const a = ready(i - d); if (a) return a;
      const b = ready(i + d); if (b) return b;
    }
    return null;
  }

  // ---- Canvas size ----
  let cw = 0, ch = 0;
  function size() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2, 1920 / hero.clientWidth);  // never bigger than the 1920px frames
    cw = canvas.width = Math.round(hero.clientWidth * dpr);
    ch = canvas.height = Math.round(hero.clientHeight * dpr);
    dirty = true; kick();
  }

  function cover(img) {
    const iw = img.width, ih = img.height;
    const s = Math.max(cw / iw, ch / ih);
    const dw = iw * s, dh = ih * s;
    return [(cw - dw) * FOCUS_X, (ch - dh) * FOCUS_Y, dw, dh];
  }

  // Draw a fractional frame. When scrolling slowly, blend frame n with n+1 so movement is continuous;
  // when scrolling fast the blend can't be seen, so draw one frame and keep it light.
  function draw(pos, blend) {
    const n = Math.floor(pos), t = pos - n;
    const a = ready(n) || nearest(n);
    if (!a) return;
    ctx.globalAlpha = 1;
    ctx.drawImage(a, ...cover(a));
    const b = blend && t > 0.02 && t < 0.98 ? ready(n + 1) : null;
    if (b) {
      ctx.globalAlpha = t;
      ctx.drawImage(b, ...cover(b));
      ctx.globalAlpha = 1;
    }
    canvas.classList.add("is-ready");
  }

  // ---- Scroll → progress, lightly smoothed over time ----
  let target = 0, current = 0, last = 0, running = false, dirty = true, drawnAt = -1;

  let wrapTop = 0, distance = 1;
  function layout() {
    wrapTop = wrap.getBoundingClientRect().top + window.scrollY;
    distance = Math.max(1, wrap.offsetHeight - hero.offsetHeight);
  }
  function measure() {
    target = Math.min(1, Math.max(0, (window.scrollY - wrapTop) / distance));
  }

  function frame(now) {
    const dt = last ? Math.min(64, now - last) : 16;
    last = now;
    current += (target - current) * (1 - Math.exp(-dt / SMOOTHING_MS));
    if (Math.abs(target - current) < 0.0004) current = target;

    const pv = current.toFixed(3);
    if (pv !== lastPv) { title.style.setProperty("--progress", pv); cue.style.setProperty("--progress", pv); lastPv = pv; }
    const pos = Math.min(1, current / MOTION_END) * (FRAME_COUNT - 1);
    const step = Math.abs(pos - drawnAt);
    if (dirty || step > 0.002) { draw(pos, dirty || step < 0.6); drawnAt = pos; dirty = false; }

    if (current !== target) requestAnimationFrame(frame);
    else { running = false; last = 0; }
  }

  function kick() {
    if (!running) { running = true; requestAnimationFrame(frame); }
  }

  window.addEventListener("scroll", () => { measure(); kick(); }, { passive: true });
  window.addEventListener("resize", () => { layout(); size(); measure(); kick(); });
  portrait.addEventListener("change", () => location.reload());
  layout();
  size();
  measure();
  current = target;   // start in place if the page loads part-way down
  kick();
})();
