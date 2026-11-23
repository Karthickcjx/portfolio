"use strict";

const crypto = require("crypto");

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) {
    return cookies;
  }

  for (const chunk of cookieHeader.split(";")) {
    const index = chunk.indexOf("=");
    if (index === -1) {
      continue;
    }
    const key = chunk.slice(0, index).trim();
    const value = chunk.slice(index + 1).trim();
    cookies[key] = decodeURIComponent(value);
  }
  return cookies;
}

function sign(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function createToken(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body, secret)}`;
}

function verifyToken(token, secret) {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [body, signature] = token.split(".");
  const expected = sign(body, secret);
  const actualBuffer = Buffer.from(signature || "", "base64url");
  const expectedBuffer = Buffer.from(expected, "base64url");

  if (actualBuffer.length !== expectedBuffer.length) {
    return null;
  }
  if (!crypto.timingSafeEqual(actualBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function prefersHtml(req) {
  return (req.headers.accept || "").includes("text/html");
}

function makeAuth(config) {
  function cookieOptions() {
    return {
      httpOnly: true,
      sameSite: "strict",
      secure: config.isProduction,
      maxAge: config.sessionTtlMs,
      path: "/"
    };
  }

  function readSession(req) {
    const token = parseCookies(req.headers.cookie || "")[config.sessionCookieName];
    const payload = verifyToken(token, config.sessionSecret);
    if (!payload || payload.sub !== config.adminUsername) {
      return null;
    }
    return payload;
  }

  function createSession(res) {
    const now = Date.now();
    const payload = {
      sub: config.adminUsername,
      csrf: crypto.randomBytes(32).toString("base64url"),
      iat: now,
      exp: now + config.sessionTtlMs
    };
    res.cookie(config.sessionCookieName, createToken(payload, config.sessionSecret), cookieOptions());
    return payload;
  }

  function clearSession(res) {
    res.clearCookie(config.sessionCookieName, {
      ...cookieOptions(),
      maxAge: 0
    });
  }

  function requireAuth(req, res, next) {
    const session = readSession(req);
    if (!session) {
      if (prefersHtml(req)) {
        res.redirect("/admin");
        return;
      }
      res.status(401).json({ error: "Authentication required." });
      return;
    }
    req.adminSession = session;
    next();
  }

  function requireCsrf(req, res, next) {
    const token = req.get("x-csrf-token") || "";
    if (!req.adminSession || token !== req.adminSession.csrf) {
      res.status(403).json({ error: "Invalid CSRF token." });
      return;
    }
    next();
  }

  return {
    clearSession,
    createSession,
    readSession,
    requireAuth,
    requireCsrf
  };
}

module.exports = {
  makeAuth
};
