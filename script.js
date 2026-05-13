const header = document.getElementById("siteHeader");

window.addEventListener("scroll", () => {
  header?.classList.toggle("scrolled", window.scrollY > 20);
});

const slides = [...document.querySelectorAll(".hero-slide")];
const dots = [...document.querySelectorAll(".slider-dots button")];
let current = 0;

function showSlide(index) {
  current = (index + slides.length) % slides.length;
  slides.forEach((slide, slideIndex) => {
    slide.classList.toggle("active", slideIndex === current);
  });
  dots.forEach((dot, dotIndex) => {
    dot.classList.toggle("active", dotIndex === current);
  });
}

document.querySelector(".next")?.addEventListener("click", () => showSlide(current + 1));
document.querySelector(".prev")?.addEventListener("click", () => showSlide(current - 1));
dots.forEach((dot, index) => dot.addEventListener("click", () => showSlide(index)));
setInterval(() => showSlide(current + 1), 6500);

document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
  anchor.addEventListener("click", (event) => {
    const id = anchor.getAttribute("href");
    if (id && id.length > 1 && id !== "#register") {
      const target = document.querySelector(id);
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    }
  });
});

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        if (entry.target.classList.contains("stats-grid")) {
          animateCounters();
        }
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.16 }
);

document.querySelectorAll(".reveal, .reveal-group, .stats-grid").forEach((element) => {
  observer.observe(element);
});

let counted = false;
const registerModal = document.getElementById("register");
const registerForm = document.querySelector(".register-form");
const callbackForm = document.querySelector(".callback-form");
const privyrWebhookUrl = "https://www.privyr.com/api/v1/incoming-leads/0vZfjMQw/xyzLRPEq";

function formatCount(value, element) {
  const prefix = element.dataset.prefix ?? "";
  const suffix = element.dataset.suffix ?? "";
  const plus = element.dataset.plus !== "false";
  const format = element.dataset.format;
  const formattedValue =
    format === "indian" ? new Intl.NumberFormat("en-IN").format(value) : String(value);

  return `${prefix}${formattedValue}${suffix}${plus ? "+" : ""}`;
}

function animateCounters() {
  if (counted) return;
  counted = true;

  document.querySelectorAll("[data-count]").forEach((element, index) => {
    const end = Number(element.dataset.count);
    const duration = 1700;
    let startTime;

    setTimeout(() => {
      const tick = (time) => {
        startTime ??= time;
        const progress = Math.min((time - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.floor(eased * end);

        element.textContent = formatCount(progress < 1 ? value : end, element);
        element.classList.add("counting");
        setTimeout(() => element.classList.remove("counting"), 120);

        if (progress < 1) {
          requestAnimationFrame(tick);
        }
      };

      requestAnimationFrame(tick);
    }, index * 120);
  });
}

document.querySelectorAll(".faq button").forEach((button) => {
  button.addEventListener("click", () => {
    button.parentElement?.classList.toggle("open");
  });
});

function trimValue(value) {
  return typeof value === "string" ? value.trim() : "";
}

function buildLeadPayload(form, source) {
  const formData = new FormData(form);
  const payload = {
    name: trimValue(formData.get("name")),
    phone: trimValue(formData.get("phone") ?? formData.get("mobile")),
    email: trimValue(formData.get("email")),
    source,
    page_url: window.location.href,
    submitted_at: new Date().toISOString(),
  };

  for (const [key, rawValue] of formData.entries()) {
    if (["name", "phone", "email", "mobile", "website"].includes(key)) {
      continue;
    }

    const value = trimValue(rawValue);
    if (value) {
      payload[key] = value;
    }
  }

  return payload;
}

async function submitLeadForm(form, successText, source, onSuccess) {
  const button = form.querySelector("button");
  if (!button) return;

  const oldText = button.textContent;
  button.disabled = true;
  button.textContent = "Submitting...";

  try {
    const response = await fetch(privyrWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(buildLeadPayload(form, source)),
    });

    if (!response.ok) {
      throw new Error(`Privyr webhook failed with status ${response.status}`);
    }

    button.textContent = successText;
    form.reset();
    window.setTimeout(() => {
      button.textContent = oldText;
      button.disabled = false;
      onSuccess?.();
    }, 1800);
  } catch (error) {
    console.error("Lead submission failed:", error);
    button.textContent = "Try Again";
    window.setTimeout(() => {
      button.textContent = oldText;
      button.disabled = false;
    }, 2200);
  }
}

callbackForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  await submitLeadForm(form, "Request Sent", "Website Callback Form");
});

registerForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  if (form.website?.value) return;

  await submitLeadForm(form, "Submitted", "Website Registration Form", () => {
    closeRegisterModal();
  });
});

function openRegisterModal() {
  registerModal?.classList.add("open");
  registerModal?.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  window.setTimeout(() => {
    registerForm?.querySelector("input")?.focus();
  }, 80);
}

function closeRegisterModal() {
  registerModal?.classList.remove("open");
  registerModal?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

document.querySelectorAll('a[href="#register"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    openRegisterModal();
  });
});

document.querySelector(".modal-close")?.addEventListener("click", closeRegisterModal);

registerModal?.addEventListener("click", (event) => {
  if (event.target === registerModal) {
    closeRegisterModal();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeRegisterModal();
  }
});

const whatsappLink = document.querySelector(".whatsapp");

if (whatsappLink) {
  whatsappLink.innerHTML =
    '<svg viewBox="0 0 32 32" aria-hidden="true"><path fill="#fff" transform="translate(.85 .95)" d="M19.11 17.19c-.28-.14-1.64-.81-1.89-.9-.25-.09-.43-.14-.61.14-.18.28-.7.9-.86 1.08-.16.18-.32.21-.6.07-.28-.14-1.16-.43-2.21-1.37-.81-.72-1.36-1.61-1.52-1.88-.16-.28-.02-.42.12-.56.12-.12.28-.32.42-.48.14-.16.18-.28.28-.46.09-.18.05-.35-.02-.49-.07-.14-.61-1.47-.84-2.02-.22-.53-.44-.46-.61-.47h-.52c-.18 0-.46.07-.7.35-.23.28-.9.88-.9 2.14 0 1.26.93 2.48 1.05 2.65.12.16 1.81 2.77 4.39 3.88.61.26 1.09.42 1.46.54.61.19 1.16.16 1.6.1.49-.07 1.64-.67 1.87-1.32.23-.65.23-1.21.16-1.32-.07-.12-.25-.18-.53-.32Z"/><path fill="#fff" d="M16.02 5.33c-5.86 0-10.62 4.76-10.62 10.62 0 1.87.49 3.7 1.41 5.3l-1.5 5.48 5.61-1.47a10.61 10.61 0 0 0 5.1 1.3h.01c5.85 0 10.62-4.76 10.62-10.62 0-2.84-1.11-5.51-3.12-7.51a10.54 10.54 0 0 0-7.51-3.1Zm0 19.45h-.01a8.8 8.8 0 0 1-4.49-1.23l-.32-.19-3.33.87.89-3.24-.21-.33a8.78 8.78 0 0 1-1.35-4.71c0-4.85 3.95-8.8 8.81-8.8 2.35 0 4.56.91 6.22 2.57a8.74 8.74 0 0 1 2.58 6.23c0 4.86-3.95 8.81-8.79 8.81Z"/></svg>';
}
