"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizePortfolio } = require("../src/validation");

test("normalizePortfolio preserves normalized experience entries", () => {
  const portfolio = normalizePortfolio({
    experience: [
      {
        role: " DevOps Intern ",
        organization: "JSpiders",
        type: "Internship",
        date: "Jan 2026 - Present",
        summary: "Built deployment workflows.",
        highlights: ["Dockerized services"],
        techs: ["AWS", "Docker"],
        url: "https://example.com/details"
      }
    ]
  });

  assert.deepEqual(portfolio.experience[0], {
    id: "devops-intern",
    role: "DevOps Intern",
    organization: "JSpiders",
    type: "Internship",
    date: "Jan 2026 - Present",
    summary: "Built deployment workflows.",
    highlights: ["Dockerized services"],
    techs: ["AWS", "Docker"],
    url: "https://example.com/details"
  });
});

test("normalizePortfolio returns empty experience for older payloads", () => {
  assert.deepEqual(normalizePortfolio({}).experience, []);
});

test("normalizePortfolio cleans invalid experience urls with hash fallback", () => {
  const portfolio = normalizePortfolio({
    experience: [{ role: "Role", url: "javascript:alert(1)" }]
  });

  assert.equal(portfolio.experience[0].url, "#");
});
