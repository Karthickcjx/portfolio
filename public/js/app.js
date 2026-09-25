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
  setLink($("#profile-website"), profile.website, safeHost(profile.website));
  $("#contact-linkedin").href = profile.linkedin || "#";
  $("#contact-linkedin strong").textContent = safeHost(profile.linkedin);
  $("#contact-github").href = profile.github || "#";
  $("#contact-github strong").textContent = safeHost(profile.github);
  $("#contact-website").href = profile.website || "#";
  $("#contact-website strong").textContent = safeHost(profile.website);

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

function renderExperience(experience) {
  const timeline = $("#experience-timeline");
  timeline.replaceChildren();
  experience.forEach((entry, index) => {
    const item = createElement("article", "experience-item reveal");
    const marker = createElement("span", "experience-marker");
    marker.setAttribute("aria-hidden", "true");

    const content = createElement("div", "experience-content");
    const header = createElement("div", "experience-header");
    const meta = createElement("p", "card-meta", `${String(index + 1).padStart(2, "0")} / ${entry.date}`);
    const type = createElement("span", "experience-type", entry.type);
    header.append(meta, type);

    const role = createElement("h3", "card-title", entry.role);
    const organization = createElement("p", "experience-organization", entry.organization);
    const summary = createElement("p", "project-description", entry.summary);
    const highlights = createElement("ul", "experience-highlights");
    entry.highlights.forEach((highlight) => {
      highlights.append(createElement("li", "", highlight));
    });
    const chips = createElement("div", "chip-list");
    entry.techs.forEach((tech) => chips.append(createElement("span", "chip", tech)));

    content.append(header, role, organization, summary, highlights, chips);
    if (entry.url && entry.url !== "#") {
      const link = createElement("a", "card-link", "View Details");
      link.href = entry.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      content.append(link);
    }

    item.append(marker, content);
    timeline.append(item);
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
  let gridOffset = 0;
  let particles = [];
  let stars = [];
  let nebulas = [];
  let shooters = [];
  let pointerThrottle = 0;
  const rootStyles = getComputedStyle(document.documentElement);
  const colors = ["--cyan", "--green", "--pink", "--amber", "--violet"]
    .map((name) => rootStyles.getPropertyValue(name).trim())
    .filter(Boolean);
  const pointer = { x: window.innerWidth / 2, y: window.innerHeight / 2 };

  function randomColor() {
    return colors[Math.floor(Math.random() * colors.length)] || "#00d5ff";
  }

  function hexToRgba(hex, alpha) {
    const clean = hex.replace("#", "").trim();
    if (clean.length !== 6) {
      return `rgba(0, 213, 255, ${alpha})`;
    }
    const value = Number.parseInt(clean, 16);
    const red = (value >> 16) & 255;
    const green = (value >> 8) & 255;
    const blue = value & 255;
    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
  }

  function createParticle(x = Math.random() * width, y = Math.random() * height, fromPointer = false) {
    const speed = fromPointer ? 4 : 1.2;
    return {
      x,
      y,
      vx: (Math.random() - 0.5) * speed,
      vy: (Math.random() - 0.5) * speed - (fromPointer ? 1.2 : 0),
      radius: fromPointer ? 2 + Math.random() * 3.5 : 0.8 + Math.random() * 2.2,
      life: 1,
      decay: fromPointer ? 0.016 + Math.random() * 0.018 : 0.0012 + Math.random() * 0.002,
      color: randomColor(),
      fromPointer,
      angle: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.08,
      shape: fromPointer ? Math.floor(Math.random() * 3) : 0
    };
  }

  function resetStars() {
    const count = Math.min(280, Math.max(120, Math.floor((width * height) / 7500)));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.35 + 0.2,
      phase: Math.random() * Math.PI * 2,
      speed: 0.012 + Math.random() * 0.018,
      color: randomColor()
    }));
  }

  function resetNebulas() {
    nebulas = Array.from({ length: 5 }, (_, index) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 150 + Math.random() * 220,
      color: colors[index % colors.length] || randomColor(),
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.5,
      vx: (Math.random() - 0.5) * 0.14,
      vy: (Math.random() - 0.5) * 0.14
    }));
  }

  function resize() {
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * scale);
    canvas.height = Math.floor(height * scale);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    const count = Math.min(120, Math.max(70, Math.floor((width * height) / 18000)));
    particles = Array.from({ length: count }, () => createParticle());
    resetStars();
    resetNebulas();
  }

  function updateParticle(particle) {
    const dx = pointer.x - particle.x;
    const dy = pointer.y - particle.y;
    const distance = Math.hypot(dx, dy);
    if (!particle.fromPointer && distance < 190 && distance > 1) {
      const force = ((190 - distance) / 190) * 0.34;
      particle.vx -= (dx / distance) * force;
      particle.vy -= (dy / distance) * force;
    }

    particle.vx *= 0.97;
    particle.vy *= 0.97;
    particle.x += particle.vx;
    particle.y += particle.vy;
    particle.angle += particle.spin;
    particle.life -= particle.decay;

    if (!particle.fromPointer) {
      if (particle.x < -12) particle.x = width + 12;
      if (particle.x > width + 12) particle.x = -12;
      if (particle.y < -12) particle.y = height + 12;
      if (particle.y > height + 12) particle.y = -12;
    }
  }

  function drawParticle(particle) {
    context.save();
    context.globalAlpha = Math.max(0, particle.life) * 0.88;
    context.shadowBlur = particle.radius * 6;
    context.shadowColor = particle.color;
    context.fillStyle = particle.color;
    context.translate(particle.x, particle.y);
    context.rotate(particle.angle);

    if (particle.shape === 1) {
      context.beginPath();
      context.moveTo(0, -particle.radius * 1.5);
      context.lineTo(particle.radius, 0);
      context.lineTo(0, particle.radius * 1.5);
      context.lineTo(-particle.radius, 0);
      context.closePath();
      context.fill();
    } else if (particle.shape === 2) {
      context.beginPath();
      for (let i = 0; i < 10; i += 1) {
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const radius = i % 2 === 0 ? particle.radius * 1.55 : particle.radius * 0.58;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) {
          context.moveTo(x, y);
        } else {
          context.lineTo(x, y);
        }
      }
      context.closePath();
      context.fill();
    } else {
      context.beginPath();
      context.arc(0, 0, particle.radius, 0, Math.PI * 2);
      context.fill();
    }

    context.restore();
  }

  function drawNebulas(time) {
    nebulas.forEach((nebula) => {
      nebula.x += nebula.vx;
      nebula.y += nebula.vy;
      if (nebula.x < -nebula.radius) nebula.x = width + nebula.radius;
      if (nebula.x > width + nebula.radius) nebula.x = -nebula.radius;
      if (nebula.y < -nebula.radius) nebula.y = height + nebula.radius;
      if (nebula.y > height + nebula.radius) nebula.y = -nebula.radius;

      const pulse = 1 + Math.sin(time * nebula.speed + nebula.phase) * 0.14;
      const radius = nebula.radius * pulse;
      const gradient = context.createRadialGradient(nebula.x, nebula.y, 0, nebula.x, nebula.y, radius);
      gradient.addColorStop(0, hexToRgba(nebula.color, 0.055));
      gradient.addColorStop(0.45, hexToRgba(nebula.color, 0.018));
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      context.beginPath();
      context.fillStyle = gradient;
      context.arc(nebula.x, nebula.y, radius, 0, Math.PI * 2);
      context.fill();
    });
  }

  function drawGrid() {
    gridOffset = (gridOffset + 0.28) % 64;
    context.save();
    context.globalAlpha = 0.026;
    context.strokeStyle = colors[0] || "#00d5ff";
    context.lineWidth = 0.5;
    for (let x = gridOffset; x < width; x += 64) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let y = gridOffset; y < height; y += 64) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }

    context.globalAlpha = 1;
    const startX = Math.floor((pointer.x - 220 - gridOffset) / 64) * 64 + gridOffset;
    const startY = Math.floor((pointer.y - 220 - gridOffset) / 64) * 64 + gridOffset;
    for (let x = startX; x < pointer.x + 220; x += 64) {
      for (let y = startY; y < pointer.y + 220; y += 64) {
        const distance = Math.hypot(x - pointer.x, y - pointer.y);
        if (distance < 220) {
          const alpha = (1 - distance / 220) * 0.55;
          context.beginPath();
          context.arc(x, y, 2, 0, Math.PI * 2);
          context.fillStyle = `rgba(0, 213, 255, ${alpha})`;
          context.shadowBlur = 9;
          context.shadowColor = "#00d5ff";
          context.fill();
          context.shadowBlur = 0;
        }
      }
    }
    context.restore();
  }

  function drawStars() {
    stars.forEach((star) => {
      star.phase += star.speed;
      const alpha = Math.max(0.08, 0.34 + Math.sin(star.phase) * 0.42);
      context.beginPath();
      context.globalAlpha = alpha;
      context.fillStyle = star.color;
      context.shadowBlur = star.radius * 5;
      context.shadowColor = star.color;
      context.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
    });
    context.globalAlpha = 1;
  }

  function drawConnections() {
    const ambient = particles.filter((particle) => !particle.fromPointer && particle.life > 0.25).slice(0, 80);
    for (let i = 0; i < ambient.length; i += 1) {
      for (let j = i + 1; j < ambient.length; j += 1) {
        const a = ambient[i];
        const b = ambient[j];
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (distance < 124) {
          context.beginPath();
          context.globalAlpha = (1 - distance / 124) * 0.16 * Math.min(a.life, b.life);
          context.strokeStyle = a.color;
          context.lineWidth = 0.55;
          context.moveTo(a.x, a.y);
          context.lineTo(b.x, b.y);
          context.stroke();
        }
      }
    }
    context.globalAlpha = 1;
  }

  function drawPointerAura(time) {
    if (!hasFinePointer) {
      return;
    }

    for (let ring = 0; ring < 3; ring += 1) {
      const radius = 42 + ring * 30 + Math.sin(time * 2 + ring) * 8;
      const alpha = 0.09 - ring * 0.022;
      const gradient = context.createRadialGradient(pointer.x, pointer.y, radius * 0.28, pointer.x, pointer.y, radius);
      gradient.addColorStop(0, `rgba(0, 213, 255, ${alpha * 2})`);
      gradient.addColorStop(1, "rgba(0, 213, 255, 0)");
      context.beginPath();
      context.fillStyle = gradient;
      context.arc(pointer.x, pointer.y, radius, 0, Math.PI * 2);
      context.fill();
    }

    for (let arc = 0; arc < 4; arc += 1) {
      const angle = time * (arc % 2 === 0 ? 1 : -1.25) + arc * (Math.PI / 2);
      const radius = 56 + arc * 18;
      context.beginPath();
      context.arc(pointer.x, pointer.y, radius, angle, angle + Math.PI * 0.42);
      context.strokeStyle = arc % 2 === 0 ? "rgba(0, 213, 255, 0.34)" : "rgba(255, 61, 129, 0.25)";
      context.lineWidth = 1;
      context.stroke();
    }
  }

  function spawnShooter() {
    if (Math.random() < 0.012 && shooters.length < 4) {
      shooters.push({
        x: Math.random() * width,
        y: -20,
        vx: (Math.random() - 0.5) * 5,
        vy: 3.5 + Math.random() * 4.5,
        life: 1,
        length: 80 + Math.random() * 70,
        color: randomColor()
      });
    }
  }

  function drawShooters() {
    shooters = shooters.filter((shooter) => shooter.life > 0 && shooter.y < height + shooter.length);
    shooters.forEach((shooter) => {
      context.save();
      context.globalAlpha = shooter.life * 0.88;
      context.strokeStyle = shooter.color;
      context.shadowBlur = 12;
      context.shadowColor = shooter.color;
      context.lineWidth = 1.4;
      context.beginPath();
      context.moveTo(shooter.x, shooter.y);
      context.lineTo(shooter.x - shooter.vx * (shooter.length / 6), shooter.y - shooter.vy * (shooter.length / 6));
      context.stroke();
      context.restore();
      shooter.x += shooter.vx;
      shooter.y += shooter.vy;
      shooter.life -= 0.014;
    });
  }

  function draw() {
    const time = performance.now() * 0.001;
    context.clearRect(0, 0, width, height);

    drawNebulas(time);
    drawGrid();
    drawStars();
    drawConnections();

    particles = particles.filter((particle) => particle.life > 0);
    const ambientTarget = Math.min(120, Math.max(70, Math.floor((width * height) / 18000)));
    let ambientCount = particles.filter((particle) => !particle.fromPointer).length;
    while (ambientCount < ambientTarget) {
      particles.push(createParticle());
      ambientCount += 1;
    }
    particles.forEach((particle) => {
      updateParticle(particle);
      drawParticle(particle);
    });

    drawPointerAura(time);
    spawnShooter();
    drawShooters();

    context.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (!hasFinePointer || pointerThrottle++ % 3 !== 0) {
      return;
    }
    for (let i = 0; i < 2; i += 1) {
      particles.push(createParticle(pointer.x + (Math.random() - 0.5) * 22, pointer.y + (Math.random() - 0.5) * 22, true));
    }
  });
  window.addEventListener("pointerdown", (event) => {
    for (let i = 0; i < 10; i += 1) {
      particles.push(createParticle(event.clientX, event.clientY, true));
    }
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
  renderExperience(portfolio.experience || []);
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
