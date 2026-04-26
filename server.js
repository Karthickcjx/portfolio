"use strict";

const path = require("path");
const compression = require("compression");
const express = require("express");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const config = require("./src/config");
const { makeAuth } = require("./src/auth");
const { verifyPassword } = require("./src/password");
const { createStorage } = require("./src/storage");
const { normalizeContact } = require("./src/validation");

const app = express();
const auth = makeAuth(config);
const storage = createStorage(config);

const publicDir = path.join(__dirname, "public");
const privateDir = path.join(__dirname, "private");
const cspDirectives = {
  "base-uri": ["'self'"],
  "connect-src": ["'self'"],
  "default-src": ["'self'"],
  "font-src": ["'self'"],
  "form-action": ["'self'"],
  "frame-ancestors": ["'none'"],
  "img-src": ["'self'", "data:"],
  "object-src": ["'none'"],
  "script-src": ["'self'"],
  "style-src": ["'self'"]
};

if (config.isProduction) {
  cspDirectives["upgrade-insecure-requests"] = [];
}

if (config.trustProxy) {
  app.set("trust proxy", 1);
}

app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: cspDirectives
    },
    crossOriginEmbedderPolicy: false
  })
);

app.use(compression());
app.use(express.json({ limit: "120kb" }));
app.use(express.urlencoded({ extended: false, limit: "30kb" }));

const contactLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 6,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please try again later." }
});

const adminApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false
});

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/portfolio", async (_req, res, next) => {
  try {
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
    res.json(await storage.getPortfolio());
  } catch (error) {
    next(error);
  }
});

app.post("/api/contact", contactLimiter, async (req, res, next) => {
  try {
    const message = normalizeContact(req.body || {});
    if (message.honeypot) {
      res.status(202).json({ ok: true });
      return;
    }
    await storage.addMessage(message);
    res.status(202).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.get("/admin", (req, res) => {
  if (auth.readSession(req)) {
    res.redirect("/admin/dashboard");
    return;
  }
  res.sendFile(path.join(privateDir, "login.html"));
});

app.get("/admin/dashboard", auth.requireAuth, (_req, res) => {
  res.sendFile(path.join(privateDir, "admin.html"));
});

app.get("/admin/assets/login.js", (_req, res) => {
  res.sendFile(path.join(privateDir, "login.js"));
});

app.get("/admin/assets/admin.js", auth.requireAuth, (_req, res) => {
  res.sendFile(path.join(privateDir, "admin.js"));
});

app.post("/admin/login", loginLimiter, async (req, res, next) => {
  try {
    if (!config.adminPasswordHash) {
      res.status(503).json({ error: "Admin credentials are not configured." });
      return;
    }

    const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const usernameMatches = username === config.adminUsername;
    const passwordMatches = usernameMatches
      ? await verifyPassword(password, config.adminPasswordHash)
      : false;

    if (!usernameMatches || !passwordMatches) {
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }

    auth.createSession(res);
    res.json({ ok: true, redirect: "/admin/dashboard" });
  } catch (error) {
    next(error);
  }
});

app.post("/admin/logout", auth.requireAuth, auth.requireCsrf, (req, res) => {
  auth.clearSession(res);
  res.json({ ok: true });
});

app.use("/api/admin", adminApiLimiter, auth.requireAuth);

app.get("/api/admin/session", (req, res) => {
  res.json({
    csrfToken: req.adminSession.csrf,
    username: req.adminSession.sub,
    expiresAt: new Date(req.adminSession.exp).toISOString()
  });
});

app.get("/api/admin/portfolio", async (_req, res, next) => {
  try {
    res.set("Cache-Control", "no-store");
    res.json(await storage.getPortfolio());
  } catch (error) {
    next(error);
  }
});

app.put("/api/admin/portfolio", auth.requireCsrf, async (req, res, next) => {
  try {
    const portfolio = await storage.savePortfolio(req.body || {});
    res.json(portfolio);
  } catch (error) {
    next(error);
  }
});

app.get("/api/admin/messages", async (_req, res, next) => {
  try {
    res.set("Cache-Control", "no-store");
    res.json(await storage.getMessages());
  } catch (error) {
    next(error);
  }
});

app.delete("/api/admin/messages/:id", auth.requireCsrf, async (req, res, next) => {
  try {
    await storage.deleteMessage(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

app.use(
  express.static(publicDir, {
    etag: true,
    maxAge: config.isProduction ? "1h" : 0,
    setHeaders(res, filePath) {
      if (filePath.endsWith(".html")) {
        res.setHeader("Cache-Control", "no-store");
      }
    }
  })
);

app.use((req, res) => {
  if (req.path.startsWith("/api/")) {
    res.status(404).json({ error: "Not found." });
    return;
  }
  res.status(404).sendFile(path.join(publicDir, "index.html"));
});

app.use((error, req, res, _next) => {
  const status = Number.isInteger(error.status) ? error.status : 500;
  const message = status >= 500 ? "Server error." : error.message;
  if (status >= 500) {
    console.error(error);
  }

  if (req.path.startsWith("/api/") || req.path.startsWith("/admin/")) {
    res.status(status).json({ error: message });
    return;
  }
  res.status(status).send(message);
});

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`Portfolio app listening on http://localhost:${config.port}`);
  });
}

module.exports = app;
