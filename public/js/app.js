"use strict";

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
const NAV_BREAKPOINT = 900;

const $ = (selector, root = document) => root.querySelector(selector);

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) {
    element.className = className;
  }
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}

function setText(selector, value) {
  const element = $(selector);
  if (element) {
    element.textContent = value || "";
  }
}

function setLink(element, url, label) {
  if (!element) {
    return;
  }
  element.href = url || "#";
  element.textContent = label || url || "";
}

function safeHost(url) {
  try {
    return new URL(url).host.replace(/^www\./, "");
  } catch {
    return url || "";
  }
}

function renderStats(stats) {
  const grid = $("#hero-stats");
  grid.replaceChildren();
  stats.forEach((stat) => {
    const card = createElement("div", "stat-card");
    const value = createElement("span", "stat-value", "0");
    value.dataset.value = String(stat.value);
    value.dataset.suffix = stat.suffix || "";
    const label = createElement("span", "stat-label", stat.label);
    card.append(value, label);
    grid.append(card);
  });
  animateCounters();
}

function renderCube(labels) {
  const cube = $("#cube");
  cube.replaceChildren();
  labels.slice(0, 6).forEach((label) => {
    cube.append(createElement("div", "cube-face", label));
  });
}

function renderProfile(profile) {
  document.title = `${profile.name} - ${profile.role}`;
  const avatar = $("#profile-avatar");
  avatar.src = profile.avatar || "/assets/profile.jpg";
  avatar.alt = profile.name;
  setText("#profile-name", profile.name);
  setText("#hero-summary", profile.heroSummary);
  setText("#profile-phone", profile.phone);
  setText("#profile-education", profile.education);
  setText("#contact-phone", profile.phone);
  setText("#footer-text", profile.footer);

  setLink($("#profile-email"), `mailto:${profile.email}`, profile.email);
  $("#contact-email").href = `mailto:${profile.email}`;
  $("#contact-email strong").textContent = profile.email;

  setLink($("#profile-linkedin"), profile.linkedin, safeHost(profile.linkedin));
  setLink($("#profile-github"), profile.github, safeHost(profile.github));
  $("#contact-linkedin").href = profile.linkedin || "#";
  $("#contact-linkedin strong").textContent = safeHost(profile.linkedin);
  $("#contact-github").href = profile.github || "#";
  $("#contact-github strong").textContent = safeHost(profile.github);

  const aboutCopy = $("#about-copy");
  aboutCopy.replaceChildren();
  profile.bio.forEach((paragraph) => {
    aboutCopy.append(createElement("p", "", paragraph));
  });

  const badges = $("#about-badges");
  badges.replaceChildren();
  profile.badges.forEach((badge) => {
    badges.append(createElement("span", "badge", badge));
  });

  renderStats(profile.stats || []);
  renderCube(profile.cubeFaces || []);
  startTyping(profile.roles || []);
}

function renderSkills(skills) {
  const grid = $("#skills-grid");
  grid.replaceChildren();
  skills.forEach((skill) => {
    const card = createElement("article", "skill-card reveal");
    card.append(createElement("h3", "skill-title", skill.category));
    const chips = createElement("div", "chip-list");
    skill.items.forEach((item) => chips.append(createElement("span", "chip", item)));
    card.append(chips);
    grid.append(card);
  });
}

function renderCertifications(certifications) {
  const grid = $("#cert-grid");
  grid.replaceChildren();
  certifications.forEach((certification) => {
    const card = createElement("article", "cert-card reveal");
    card.append(
      createElement("h3", "card-title", certification.name),
      createElement("p", "cert-issuer", certification.issuer),
      createElement("p", "cert-year", certification.year)
    );
    grid.append(card);
  });
}

function renderProjects(projects) {
  const grid = $("#projects-grid");
  grid.replaceChildren();
  projects.forEach((project, index) => {
    const card = createElement("article", "project-card reveal");
    const meta = createElement("p", "card-meta", `${String(index + 1).padStart(2, "0")} / ${project.date}`);
    const title = createElement("h3", "card-title", project.title);
    const description = createElement("p", "project-description", project.description);
    const chips = createElement("div", "chip-list");
    project.techs.forEach((tech) => chips.append(createElement("span", "chip", tech)));
    const stats = createElement("div", "chip-list");
    project.stats.forEach((stat) => stats.append(createElement("span", "chip", stat)));
    const link = createElement("a", "card-link", "View Project");
    link.href = project.url || "#";
    link.target = "_blank";
    link.rel = "noreferrer";
    card.append(meta, title, description, stats, chips, link);
    grid.append(card);
  });
  observeReveal();
}

function animateCounters() {
  document.querySelectorAll(".stat-value").forEach((element) => {
    const target = Number(element.dataset.value || "0");
    const suffix = element.dataset.suffix || "";
    if (prefersReducedMotion) {
      element.textContent = `${target}${suffix}`;
      return;
    }
    let frame = 0;
    const totalFrames = 46;
    const tick = () => {
      frame += 1;
      const progress = Math.min(frame / totalFrames, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      const rendered = Number.isInteger(target) ? Math.round(value) : value.toFixed(1);
      element.textContent = `${rendered}${suffix}`;
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };
    tick();
  });
}

let typingTimer = null;

function startTyping(roles) {
  const target = $("#typed-role");
  if (!roles.length || !target) {
    return;
  }
  if (typingTimer) {
    clearTimeout(typingTimer);
  }
  if (prefersReducedMotion) {
    target.textContent = roles[0];
    return;
  }

  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;

  function tick() {
    const role = roles[roleIndex];
    charIndex += deleting ? -1 : 1;
    target.textContent = role.slice(0, charIndex);

    if (!deleting && charIndex === role.length) {
      deleting = true;
      typingTimer = setTimeout(tick, 1400);
      return;
    }

    if (deleting && charIndex === 0) {
      deleting = false;
      roleIndex = (roleIndex + 1) % roles.length;
    }

    typingTimer = setTimeout(tick, deleting ? 52 : 96);
  }

  tick();
}

function observeReveal() {
  const elements = document.querySelectorAll(".reveal");
  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14 }
  );
  elements.forEach((element) => observer.observe(element));
}

function setupMagicPointer() {
  const cursorCore = $("#cursor-core");
  const cursorRing = $("#cursor-ring");
  if (!cursorCore || !cursorRing || prefersReducedMotion || !hasFinePointer) {
    return;
  }

  document.body.classList.add("has-fancy-pointer");

  const rootStyles = getComputedStyle(document.documentElement);
  const colors = [
    rootStyles.getPropertyValue("--cyan").trim(),
    rootStyles.getPropertyValue("--pink").trim(),
    rootStyles.getPropertyValue("--green").trim()
  ];

  let pointerX = window.innerWidth / 2;
  let pointerY = window.innerHeight / 2;
  let ringX = pointerX;
  let ringY = pointerY;
  let trailThrottle = 0;

  function spawnTrail(x, y) {
    if (trailThrottle++ % 2 !== 0) {
      return;
    }
    const dot = createElement("div", "cursor-trail-dot");
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 4 + Math.random() * 5;
    dot.style.left = `${x + (Math.random() - 0.5) * 10}px`;
    dot.style.top = `${y + (Math.random() - 0.5) * 10}px`;
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    dot.style.background = color;
    dot.style.boxShadow = `0 0 ${size * 2}px ${color}`;
    dot.style.animationDuration = `${0.42 + Math.random() * 0.24}s`;
    document.body.append(dot);
    window.setTimeout(() => dot.remove(), 700);
  }

  function spawnRipple(x, y) {
    const ripple = createElement("div", "cursor-ripple");
    const palette = [
      "rgba(0, 213, 255, 0.42)",
      "rgba(255, 61, 129, 0.34)",
      "rgba(0, 245, 159, 0.28)"
    ];
    const color = palette[Math.floor(Math.random() * palette.length)];
    const size = 56 + Math.random() * 36;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.border = `2px solid ${color}`;
    ripple.style.boxShadow = `0 0 22px ${color}`;
    document.body.append(ripple);
    window.setTimeout(() => ripple.remove(), 920);
  }

  function tick() {
    ringX += (pointerX - ringX) * 0.18;
    ringY += (pointerY - ringY) * 0.18;
    cursorRing.style.left = `${ringX}px`;
    cursorRing.style.top = `${ringY}px`;
    requestAnimationFrame(tick);
  }

  window.addEventListener("pointermove", (event) => {
    pointerX = event.clientX;
    pointerY = event.clientY;
    cursorCore.style.left = `${pointerX}px`;
    cursorCore.style.top = `${pointerY}px`;
    spawnTrail(pointerX, pointerY);
  });

  window.addEventListener("pointerdown", (event) => {
    spawnRipple(event.clientX, event.clientY);
  });

  tick();
}

function setupAnchorNavigation() {
  function scrollToHash(hash, behavior = prefersReducedMotion ? "auto" : "smooth") {
    if (!hash || hash === "#") {
      return false;
    }

    const target = $(hash);
    if (!target) {
      return false;
    }

    const header = $("#site-nav");
    const headerOffset = header ? header.getBoundingClientRect().height + 18 : 0;
    const top = target.id === "hero"
      ? 0
      : Math.max(window.scrollY + target.getBoundingClientRect().top - headerOffset, 0);

    window.scrollTo({ top, behavior });
    return true;
  }

  document.addEventListener("click", (event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    const link = event.target.closest('a[href^="#"]');
    if (!link) {
      return;
    }

    const hash = link.getAttribute("href");
    if (!scrollToHash(hash)) {
      return;
    }

    event.preventDefault();
    if (window.location.hash !== hash) {
      window.history.pushState(null, "", hash);
    }
  });

  if (window.location.hash) {
    window.setTimeout(() => {
      scrollToHash(window.location.hash, "auto");
    }, 0);
  }

  window.addEventListener("hashchange", () => {
    scrollToHash(window.location.hash, "auto");
  });
}

function setupNavMenu() {
  const header = $("#site-nav");
  const toggle = $("#nav-toggle");
  const nav = $("#primary-nav");
  if (!header || !toggle || !nav) {
    return;
  }

  function setOpen(open) {
    header.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  }

  toggle.addEventListener("click", () => {
    setOpen(!header.classList.contains("is-open"));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= NAV_BREAKPOINT) {
        setOpen(false);
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (
      window.innerWidth <= NAV_BREAKPOINT &&
      header.classList.contains("is-open") &&
      !header.contains(event.target)
    ) {
      setOpen(false);
    }
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > NAV_BREAKPOINT) {
      setOpen(false);
    }
  });
}

function setupTilt(element, { maxX, maxY, getBaseTransform = () => "" } = {}) {
  if (!element) {
    return;
  }

  const reset = () => {
    element.style.transform = getBaseTransform();
  };

  reset();
  if (prefersReducedMotion || !hasFinePointer) {
    return;
  }

  element.addEventListener("pointermove", (event) => {
    const rect = element.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    const rotateY = (px * maxY).toFixed(2);
    const rotateX = (py * -maxX).toFixed(2);
    element.style.transform = `${getBaseTransform()}rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });
  element.addEventListener("pointerleave", reset);
  window.addEventListener("resize", reset);
}

function setupInteractiveSurfaces() {
  setupTilt($(".system-orbit"), { maxX: 10, maxY: 16 });
  setupTilt($(".profile-panel"), { maxX: 7, maxY: 10, getBaseTransform: () => "perspective(900px) " });
}

function setupContactForm() {
  const form = $("#contact-form");
  const status = $("#contact-status");
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.classList.remove("is-error");
    status.textContent = "Sending...";
    const payload = {
      name: $("#contact-name").value,
      email: $("#contact-email-input").value,
      message: $("#contact-message").value,
      website: $("#contact-website").value
    };

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Message could not be sent.");
      }
      form.reset();
      status.textContent = "Message sent successfully.";
    } catch (error) {
      status.classList.add("is-error");
      status.textContent = error.message;
    }
  });
}

function setupCanvas() {
  const canvas = $("#signal-canvas");
  if (!canvas || prefersReducedMotion) {
    return;
  }
  const context = canvas.getContext("2d");
  let width = 0;
  let height = 0;
  let particles = [];
  const colors = ["#00d5ff", "#00f59f", "#ff3d81", "#ffd166", "#8e6bff"];
  const pointer = { x: 0, y: 0 };

  function resize() {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    const count = Math.max(60, Math.floor((width * height) / 17000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 1.8 + 0.4,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
  }

  function draw() {
    context.clearRect(0, 0, width, height);
    context.globalAlpha = 0.9;
    particles.forEach((particle) => {
      const dx = pointer.x - particle.x;
      const dy = pointer.y - particle.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 150 && distance > 1) {
        const force = (150 - distance) / 1500;
        particle.vx -= dx * force * 0.012;
        particle.vy -= dy * force * 0.012;
      }
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.995;
      particle.vy *= 0.995;
      if (particle.x < 0) particle.x = width;
      if (particle.x > width) particle.x = 0;
      if (particle.y < 0) particle.y = height;
      if (particle.y > height) particle.y = 0;

      context.beginPath();
      context.fillStyle = particle.color;
      context.shadowBlur = 8;
      context.shadowColor = particle.color;
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
    });

    for (let i = 0; i < particles.length; i += 1) {
      for (let j = i + 1; j < particles.length; j += 1) {
        const a = particles[i];
        const b = particles[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance < 110) {
          context.beginPath();
          context.globalAlpha = (1 - distance / 110) * 0.16;
          context.strokeStyle = a.color;
          context.lineWidth = 0.7;
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.stroke();
        }
      }
    }
    context.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  });
  resize();
  draw();
}

async function init() {
  setupMagicPointer();
  setupAnchorNavigation();
  setupNavMenu();
  setupCanvas();
  setupContactForm();
  const response = await fetch("/api/portfolio", { headers: { Accept: "application/json" } });
  const portfolio = await response.json();
  renderProfile(portfolio.profile);
  renderSkills(portfolio.skills);
  renderCertifications(portfolio.certifications);
  renderProjects(portfolio.projects);
  observeReveal();
  setupInteractiveSurfaces();
}

init().catch((error) => {
  console.error(error);
  setText("#hero-summary", "Portfolio data is temporarily unavailable.");
});
