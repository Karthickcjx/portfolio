"use strict";

const crypto = require("crypto");

function asString(value, maxLength, fallback = "") {
  if (typeof value !== "string") {
    return fallback;
  }
  return value.trim().slice(0, maxLength);
}

function asStringArray(value, maxItems, maxLength) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => asString(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function slugify(value, fallbackPrefix = "item") {
  const slug = asString(value, 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `${fallbackPrefix}-${crypto.randomUUID()}`;
}

function cleanUrl(value, fallback = "") {
  const url = asString(value, 300, fallback);
  if (!url || url === "#") {
    return fallback;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol === "https:" || parsed.protocol === "http:" || parsed.protocol === "mailto:") {
      return parsed.toString();
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function normalizeStats(stats) {
  if (!Array.isArray(stats)) {
    return [];
  }

  return stats.slice(0, 6).map((stat, index) => {
    const value = Number(stat.value);
    return {
      label: asString(stat.label, 40, `Stat ${index + 1}`),
      value: Number.isFinite(value) ? Math.max(0, Math.min(value, 999999)) : 0,
      suffix: asString(stat.suffix, 8)
    };
  });
}

function normalizePortfolio(input) {
  if (!input || typeof input !== "object") {
    const error = new Error("Portfolio payload must be an object.");
    error.status = 400;
    throw error;
  }

  const profile = input.profile || {};
  const normalized = {
    profile: {
      name: asString(profile.name, 80, "Karthick Raja G"),
      role: asString(profile.role, 120, "DevOps & Full-Stack Developer"),
      heroSummary: asString(profile.heroSummary, 320),
      bio: asStringArray(profile.bio, 5, 360),
      badges: asStringArray(profile.badges, 16, 40),
      email: asString(profile.email, 160),
      phone: asString(profile.phone, 40),
      linkedin: cleanUrl(profile.linkedin),
      github: cleanUrl(profile.github),
      education: asString(profile.education, 120),
      avatar: asString(profile.avatar, 120, "/assets/profile.jpg").startsWith("/")
        ? asString(profile.avatar, 120, "/assets/profile.jpg")
        : "/assets/profile.jpg",
      footer: asString(profile.footer, 120),
      roles: asStringArray(profile.roles, 8, 40),
      cubeFaces: asStringArray(profile.cubeFaces, 6, 18),
      stats: normalizeStats(profile.stats)
    },
    projects: [],
    skills: [],
    certifications: []
  };

  if (Array.isArray(input.projects)) {
    normalized.projects = input.projects.slice(0, 24).map((project) => {
      const title = asString(project.title, 140, "Untitled Project");
      return {
        id: asString(project.id, 120) || slugify(title, "project"),
        title,
        date: asString(project.date, 80),
        description: asString(project.description, 900),
        url: cleanUrl(project.url, "#"),
        techs: asStringArray(project.techs, 18, 40),
        stats: asStringArray(project.stats, 4, 40)
      };
    });
  }

  if (Array.isArray(input.skills)) {
    normalized.skills = input.skills.slice(0, 12).map((skill) => ({
      category: asString(skill.category, 80, "Skill Category"),
      items: asStringArray(skill.items, 24, 40)
    }));
  }

  if (Array.isArray(input.certifications)) {
    normalized.certifications = input.certifications.slice(0, 24).map((certification) => {
      const name = asString(certification.name, 140, "Certification");
      return {
        id: asString(certification.id, 120) || slugify(name, "cert"),
        name,
        issuer: asString(certification.issuer, 120),
        year: asString(certification.year, 20)
      };
    });
  }

  return normalized;
}

function normalizeContact(input) {
  const honeypot = asString(input.website || input.company, 120);
  if (honeypot) {
    return { honeypot: true };
  }

  const name = asString(input.name, 80);
  const email = asString(input.email, 160).toLowerCase();
  const message = asString(input.message, 2000);

  if (!name || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error("Please provide a valid name, email, and message.");
    error.status = 400;
    throw error;
  }

  return {
    id: crypto.randomUUID(),
    name,
    email,
    message,
    createdAt: new Date().toISOString(),
    status: "new"
  };
}

module.exports = {
  normalizeContact,
  normalizePortfolio,
  slugify
};
