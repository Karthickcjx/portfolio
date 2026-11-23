"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { createStorage } = require("../src/storage");
const { normalizePortfolio } = require("../src/validation");
const { makeAuth } = require("../src/auth");
const { renderPortfolioPage } = require("../src/render");

test("storage recovers after invalid portfolio and message write failures", async (t) => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "portfolio-test-"));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const storage = createStorage({ dataDir: dir });
  await assert.rejects(storage.savePortfolio({ projects: [null] }), { status: 400 });
  await storage.savePortfolio({ profile: { name: "Recovered" } });
  assert.equal((await storage.getPortfolio()).profile.name, "Recovered");
  await fs.mkdir(path.join(dir, "messages.json"));
  await assert.rejects(storage.addMessage({ id: "failed" }));
  await fs.rmdir(path.join(dir, "messages.json"));
  await Promise.all([storage.addMessage({ id: "one" }), storage.addMessage({ id: "two" })]);
  assert.deepEqual((await storage.getMessages()).map(m => m.id), ["two", "one"]);
  await storage.deleteMessage("one");
  assert.deepEqual((await storage.getMessages()).map(m => m.id), ["two"]);
});

test("malformed objects return validation errors", () => {
  for (const key of ["projects", "experience", "skills", "certifications"]) {
    for (const value of [null, [], "bad"]) {
      assert.throws(() => normalizePortfolio({ [key]: [value] }), { status: 400 });
    }
  }
  assert.throws(() => normalizePortfolio([]), { status: 400 });
  assert.throws(() => normalizePortfolio({ profile: { stats: [null] } }), { status: 400 });
});

test("malformed unrelated cookie does not invalidate a valid session", () => {
  const auth = makeAuth({ sessionCookieName: "admin", sessionSecret: "test", sessionTtlMs: 60000, adminUsername: "tester" });
  let cookie;
  auth.createSession({ cookie: (_name, value) => { cookie = value; } });
  assert.equal(auth.readSession({ headers: { cookie: "bad=%; admin=" + cookie } }).sub, "tester");
  assert.equal(auth.readSession({ headers: { cookie: "admin=%" } }), null);
});

test("server HTML includes portfolio content and escapes untrusted text", async () => {
  const template = await fs.readFile(path.join(__dirname, "../public/index.html"), "utf8");
  const portfolio = normalizePortfolio({ profile: { name: "<script>bad</script>", heroSummary: "Summary $&", bio: ["Biography"] }, projects: [{ title: "Project", description: "<img onerror=bad>" }] });
  const html = renderPortfolioPage(template, portfolio);
  assert.ok(html.includes("&lt;script&gt;bad&lt;/script&gt;"));
  assert.ok(html.includes("Summary $&"));
  assert.ok(html.includes("Biography"));
  assert.ok(html.includes("&lt;img onerror=bad&gt;"));
  assert.ok(!html.includes("<script>bad</script>"));
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(ids.length, new Set(ids).size);
});
