/* ============================================================
   Kamir Group — Interactions & Animations
   ============================================================ */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Sticky nav background on scroll ---------- */
  const nav = document.querySelector(".nav");
  if (nav) {
    const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---------- Mobile menu ---------- */
  const toggle = document.querySelector(".nav-toggle");
  const menu = document.querySelector(".mobile-menu");
  if (toggle && menu) {
    const close = () => {
      toggle.classList.remove("open");
      menu.classList.remove("open");
      document.body.style.overflow = "";
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      toggle.classList.toggle("open", open);
      document.body.style.overflow = open ? "hidden" : "";
      toggle.setAttribute("aria-expanded", String(open));
    });
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", close));
  }

  /* ---------- Scroll reveal ---------- */
  const revealEls = document.querySelectorAll(".reveal");
  if (prefersReduced || !("IntersectionObserver" in window)) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else {
    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            obs.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  }

  /* ---------- Animated counters ---------- */
  const counters = document.querySelectorAll("[data-count]");
  const i18n = window.KamirI18N;
  const suffixOf = (el) => {
    const key = el.dataset.suffixKey;
    if (key && i18n) {
      const d = i18n.dict[i18n.current()] || {};
      if (d[key] != null) return d[key];
    }
    return el.dataset.suffix || "";
  };
  const finalText = (el) => (el.dataset.prefix || "") + Number(el.dataset.count).toLocaleString("en-US") + suffixOf(el);
  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = (el.dataset.count.split(".")[1] || "").length;
    const suffix = suffixOf(el);
    const prefix = el.dataset.prefix || "";
    const dur = 1600;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = (target * eased).toFixed(decimals);
      el.textContent = prefix + Number(val).toLocaleString("en-US") + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = finalText(el);
    };
    requestAnimationFrame(tick);
  };
  // Re-render finished counters when language changes (suffix may differ)
  window.addEventListener("langchange", () => {
    counters.forEach((el) => { if (el.dataset.done === "1") el.textContent = finalText(el); });
  });
  if (counters.length) {
    if (prefersReduced || !("IntersectionObserver" in window)) {
      counters.forEach((el) => { el.textContent = finalText(el); el.dataset.done = "1"; });
    } else {
      const cio = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animateCount(entry.target);
              entry.target.dataset.done = "1";
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.5 }
      );
      counters.forEach((el) => cio.observe(el));
    }
  }

  /* ---------- Subtle hero parallax ---------- */
  const heroPhoto = document.querySelector(".hero__media");
  if (heroPhoto && !prefersReduced) {
    let raf = null;
    window.addEventListener(
      "scroll",
      () => {
        if (raf) return;
        raf = requestAnimationFrame(() => {
          const y = window.scrollY;
          if (y < window.innerHeight) {
            heroPhoto.style.transform = "translateY(" + y * 0.18 + "px)";
          }
          raf = null;
        });
      },
      { passive: true }
    );
  }

  /* ---------- Project filters ---------- */
  const filters = document.querySelectorAll(".filter");
  const projects = document.querySelectorAll("[data-category]");
  if (filters.length && projects.length) {
    filters.forEach((btn) => {
      btn.addEventListener("click", () => {
        filters.forEach((f) => f.classList.remove("active"));
        btn.classList.add("active");
        const cat = btn.dataset.filter;
        projects.forEach((p) => {
          const show = cat === "all" || p.dataset.category === cat;
          p.style.display = show ? "" : "none";
        });
      });
    });
  }

  /* ---------- Contact / portal form (front-end demo) ---------- */
  const t = (key, fallback) => {
    const d = i18n ? i18n.dict[i18n.current()] : null;
    return (d && d[key] != null) ? d[key] : fallback;
  };
  document.querySelectorAll("form[data-demo]").forEach((form) => {
    const sendingKey = form.dataset.sendingKey || "con.f.sending";
    const sentKey = form.dataset.sentKey || "con.f.sent";
    const resultKey = form.dataset.resultKey || "con.f.result";
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const btn = form.querySelector("[type=submit]");
      const note = form.querySelector(".form-result");
      if (btn) {
        const labelEl = btn.querySelector("[data-i18n]") || btn;
        const originalKey = labelEl.getAttribute && labelEl.getAttribute("data-i18n");
        labelEl.textContent = t(sendingKey, "Sending…");
        btn.disabled = true;
        setTimeout(() => {
          labelEl.textContent = t(sentKey, "Message sent ✓");
          if (note) {
            note.textContent = t(resultKey, "Thanks — we'll be in touch.");
            note.style.color = "var(--sage)";
          }
          form.reset();
          setTimeout(() => {
            if (originalKey) {
              labelEl.setAttribute("data-i18n", originalKey);
              labelEl.textContent = t(originalKey, "");
            }
            btn.disabled = false;
          }, 2600);
        }, 1100);
      }
    });
  });

  /* ---------- Password show/hide toggle ---------- */
  document.querySelectorAll("[data-pw-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const wrap = btn.closest(".pw-wrap");
      const input = wrap && wrap.querySelector("input");
      if (!input) return;
      const show = input.type === "password";
      input.type = show ? "text" : "password";
      const eye = btn.querySelector(".pw-eye");
      const eyeOff = btn.querySelector(".pw-eye-off");
      if (eye) eye.style.display = show ? "none" : "";
      if (eyeOff) eyeOff.style.display = show ? "" : "none";
      btn.setAttribute("aria-label", show ? t("portal.hidePw", "Hide password") : t("portal.showPw", "Show password"));
    });
  });
})();
