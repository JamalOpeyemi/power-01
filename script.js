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
