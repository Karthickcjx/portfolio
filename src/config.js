"use strict";

const crypto = require("crypto");
require("dotenv").config();

const isProduction = process.env.NODE_ENV === "production";

function readInt(name, fallback) {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : fallback;
}

function requireProductionValue(name, value) {
  if (isProduction && !value) {
    throw new Error(`${name} is required in production.`);
  }
}

let sessionSecret = process.env.SESSION_SECRET || "";
if (!sessionSecret && !isProduction) {
  sessionSecret = crypto.randomBytes(48).toString("base64url");
  console.warn("SESSION_SECRET is not set. Using an ephemeral development secret.");
}

requireProductionValue("SESSION_SECRET", sessionSecret);

if (isProduction && sessionSecret.length < 32) {
  throw new Error("SESSION_SECRET must be at least 32 characters in production.");
}

const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || "";
requireProductionValue("ADMIN_PASSWORD_HASH", adminPasswordHash);

module.exports = {
  adminPasswordHash,
  adminUsername: process.env.ADMIN_USERNAME || "karthick",
  dataDir: process.env.DATA_DIR || "data",
  isProduction,
  port: readInt("PORT", 3000),
  sessionCookieName: process.env.SESSION_COOKIE_NAME || "kr_admin",
  sessionSecret,
  sessionTtlMs: readInt("SESSION_TTL_MS", 8 * 60 * 60 * 1000),
  trustProxy: process.env.TRUST_PROXY === "1"
};
