"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const vm = require("vm");
const crypto = require("crypto");

test("new entries with duplicate names retain both records and saves preserve profile drafts", async () => {
  const elements = new Map();
  const element = (selector) => {
    if (!elements.has(selector)) elements.set(selector, { value: "", handlers: {}, addEventListener(event, callback) { this.handlers[event] = callback; } });
    return elements.get(selector);
  };
  const context = vm.createContext({ crypto, document: { querySelector: element }, window: {}, console });
  const source = fs.readFileSync(require.resolve("../private/admin.js"), "utf8").split("init().catch")[0];
  vm.runInContext(source, context);
  vm.runInContext('state.portfolio = { profile: {}, projects: [], experience: [], certifications: [], skills: [] }; renderAll = () => {}; showStatus = () => {}; api = async (_path, options) => JSON.parse(JSON.stringify(options.body)); setupForms();', context);
  element("#admin-name").value = "Unsaved profile draft";
  for (const [form, input, collection] of [["#project-form", "#project-title", "projects"], ["#experience-form", "#experience-role", "experience"], ["#cert-form", "#cert-name", "certifications"]]) {
    for (let i = 0; i < 2; i++) {
      element(input).value = "Repeated name";
      await element(form).handlers.submit({ preventDefault() {} });
    }
    assert.equal(vm.runInContext('state.portfolio.' + collection + '.length', context), 2);
    assert.equal(vm.runInContext('new Set(state.portfolio.' + collection + '.map(item => item.id)).size', context), 2);
  }
  // Run the real renderAll with only list rendering stubbed; it must not refill profile inputs.
  vm.runInContext(source.slice(source.indexOf("function renderAll()"), source.indexOf("function setupTabs()")), context);
  vm.runInContext('renderExperience = renderProjects = renderSkills = renderCertifications = () => {}; renderAll();', context);
  assert.equal(element("#admin-name").value, "Unsaved profile draft");
});
