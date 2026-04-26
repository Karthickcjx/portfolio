"use strict";

const state = {
  csrfToken: "",
  portfolio: null,
  messages: []
};

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

async function api(path, options = {}) {
  const headers = {
    Accept: "application/json",
    ...(options.headers || {})
  };

  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (options.method && options.method !== "GET") {
    headers["x-csrf-token"] = state.csrfToken;
  }

  const response = await fetch(path, {
    method: options.method || "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  if (response.status === 401) {
    window.location.assign("/admin");
    return null;
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || "Request failed.");
  }
  return result;
}

function showStatus(key, message, isError = false) {
  const element = document.querySelector(`[data-status="${key}"]`);
  if (!element) {
    return;
  }
  element.classList.toggle("is-error", isError);
  element.textContent = message;
  if (!isError) {
    window.setTimeout(() => {
      element.textContent = "";
    }, 2600);
  }
}

function splitList(value) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function joinList(items) {
  return (items || []).join("\n");
}

function slugify(value, prefix) {
  const slug = String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || `${prefix}-${Date.now()}`;
}

function formatStats(stats) {
  return (stats || []).map((stat) => `${stat.label}|${stat.value}|${stat.suffix || ""}`).join("\n");
}

function parseStats(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, value, suffix] = line.split("|");
      return {
        label: (label || "").trim(),
        value: Number(value || 0),
        suffix: (suffix || "").trim()
      };
    });
}

function fillProfileForm() {
  const profile = state.portfolio.profile;
  $("#admin-name").value = profile.name || "";
  $("#admin-role").value = profile.role || "";
  $("#admin-email").value = profile.email || "";
  $("#admin-phone").value = profile.phone || "";
  $("#admin-linkedin").value = profile.linkedin || "";
  $("#admin-github").value = profile.github || "";
  $("#admin-education").value = profile.education || "";
  $("#admin-footer").value = profile.footer || "";
  $("#admin-summary").value = profile.heroSummary || "";
  $("#admin-bio").value = joinList(profile.bio);
  $("#admin-badges").value = joinList(profile.badges);
  $("#admin-roles").value = joinList(profile.roles);
  $("#admin-cube").value = joinList(profile.cubeFaces);
  $("#admin-stats").value = formatStats(profile.stats);
}

function collectProfileForm() {
  return {
    ...state.portfolio.profile,
    name: $("#admin-name").value,
    role: $("#admin-role").value,
    email: $("#admin-email").value,
    phone: $("#admin-phone").value,
    linkedin: $("#admin-linkedin").value,
    github: $("#admin-github").value,
    education: $("#admin-education").value,
    footer: $("#admin-footer").value,
    heroSummary: $("#admin-summary").value,
    bio: $("#admin-bio").value.split("\n").map((item) => item.trim()).filter(Boolean),
    badges: splitList($("#admin-badges").value),
    roles: splitList($("#admin-roles").value),
    cubeFaces: splitList($("#admin-cube").value).slice(0, 6),
    stats: parseStats($("#admin-stats").value)
  };
}

async function savePortfolio(key, message) {
  state.portfolio = await api("/api/admin/portfolio", {
    method: "PUT",
    body: state.portfolio
  });
  renderAll();
  showStatus(key, message);
}

function createAdminListItem(title, meta, actions, body) {
  const item = createElement("article", "admin-list-item");
  const content = createElement("div");
  content.append(createElement("h3", "admin-list-title", title));
  if (meta) {
    content.append(createElement("p", "admin-list-meta", meta));
  }
  if (body) {
    content.append(createElement("p", "message-body", body));
  }
  const actionWrap = createElement("div", "admin-list-actions");
  actions.forEach((action) => actionWrap.append(action));
  item.append(content, actionWrap);
  return item;
}

function smallButton(label, variant, onClick) {
  const button = createElement("button", `button ${variant} small-button`, label);
  button.type = "button";
  button.addEventListener("click", onClick);
  return button;
}

function resetProjectForm() {
  $("#project-id").value = "";
  $("#project-title").value = "";
  $("#project-date").value = "";
  $("#project-description").value = "";
  $("#project-url").value = "";
  $("#project-techs").value = "";
  $("#project-stats").value = "";
}

function renderProjects() {
  const list = $("#project-list");
  list.replaceChildren();
  state.portfolio.projects.forEach((project) => {
    const edit = smallButton("Edit", "button-secondary", () => {
      $("#project-id").value = project.id;
      $("#project-title").value = project.title;
      $("#project-date").value = project.date;
      $("#project-description").value = project.description;
      $("#project-url").value = project.url === "#" ? "" : project.url;
      $("#project-techs").value = (project.techs || []).join(", ");
      $("#project-stats").value = (project.stats || []).join(", ");
      $("#project-title").focus();
    });
    const remove = smallButton("Delete", "button-danger", async () => {
      if (!window.confirm(`Delete ${project.title}?`)) {
        return;
      }
      state.portfolio.projects = state.portfolio.projects.filter((item) => item.id !== project.id);
      await savePortfolio("projects", "Project deleted.");
    });
    list.append(createAdminListItem(project.title, project.date, [edit, remove], project.description));
  });
}

function resetSkillForm() {
  $("#skill-index").value = "";
  $("#skill-category").value = "";
  $("#skill-items").value = "";
}

function renderSkills() {
  const list = $("#skill-list");
  list.replaceChildren();
  state.portfolio.skills.forEach((skill, index) => {
    const edit = smallButton("Edit", "button-secondary", () => {
      $("#skill-index").value = String(index);
      $("#skill-category").value = skill.category;
      $("#skill-items").value = (skill.items || []).join(", ");
      $("#skill-category").focus();
    });
    const remove = smallButton("Delete", "button-danger", async () => {
      if (!window.confirm(`Delete ${skill.category}?`)) {
        return;
      }
      state.portfolio.skills.splice(index, 1);
      await savePortfolio("skills", "Skill category deleted.");
    });
    list.append(createAdminListItem(skill.category, (skill.items || []).join(", "), [edit, remove]));
  });
}

function resetCertForm() {
  $("#cert-id").value = "";
  $("#cert-name").value = "";
  $("#cert-issuer").value = "";
  $("#cert-year").value = "";
}

function renderCertifications() {
  const list = $("#cert-list");
  list.replaceChildren();
  state.portfolio.certifications.forEach((certification) => {
    const edit = smallButton("Edit", "button-secondary", () => {
      $("#cert-id").value = certification.id;
      $("#cert-name").value = certification.name;
      $("#cert-issuer").value = certification.issuer;
      $("#cert-year").value = certification.year;
      $("#cert-name").focus();
    });
    const remove = smallButton("Delete", "button-danger", async () => {
      if (!window.confirm(`Delete ${certification.name}?`)) {
        return;
      }
      state.portfolio.certifications = state.portfolio.certifications.filter((item) => item.id !== certification.id);
      await savePortfolio("certs", "Certification deleted.");
    });
    list.append(createAdminListItem(certification.name, `${certification.issuer} - ${certification.year}`, [edit, remove]));
  });
}

function renderMessages() {
  const list = $("#message-list");
  list.replaceChildren();
  if (!state.messages.length) {
    list.append(createAdminListItem("No messages yet", "", [], ""));
    return;
  }
  state.messages.forEach((message) => {
    const remove = smallButton("Delete", "button-danger", async () => {
      await api(`/api/admin/messages/${encodeURIComponent(message.id)}`, { method: "DELETE" });
      state.messages = state.messages.filter((item) => item.id !== message.id);
      renderMessages();
    });
    const meta = `${message.email} - ${new Date(message.createdAt).toLocaleString()}`;
    list.append(createAdminListItem(message.name, meta, [remove], message.message));
  });
}

function renderAll() {
  fillProfileForm();
  renderProjects();
  renderSkills();
  renderCertifications();
}

function setupTabs() {
  document.querySelectorAll(".admin-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".admin-tab").forEach((item) => item.classList.remove("is-active"));
      document.querySelectorAll(".admin-panel").forEach((panel) => panel.classList.remove("is-active"));
      tab.classList.add("is-active");
      document.getElementById(tab.dataset.tab).classList.add("is-active");
    });
  });
}

function setupForms() {
  $("#profile-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      state.portfolio.profile = collectProfileForm();
      await savePortfolio("profile", "Profile saved.");
    } catch (error) {
      showStatus("profile", error.message, true);
    }
  });

  $("#project-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const id = $("#project-id").value || slugify($("#project-title").value, "project");
      const project = {
        id,
        title: $("#project-title").value,
        date: $("#project-date").value,
        description: $("#project-description").value,
        url: $("#project-url").value || "#",
        techs: splitList($("#project-techs").value),
        stats: splitList($("#project-stats").value)
      };
      const index = state.portfolio.projects.findIndex((item) => item.id === id);
      if (index >= 0) {
        state.portfolio.projects[index] = project;
      } else {
        state.portfolio.projects.unshift(project);
      }
      await savePortfolio("projects", "Project saved.");
      resetProjectForm();
    } catch (error) {
      showStatus("projects", error.message, true);
    }
  });

  $("#skill-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const indexValue = $("#skill-index").value;
      const skill = {
        category: $("#skill-category").value,
        items: splitList($("#skill-items").value)
      };
      if (indexValue) {
        state.portfolio.skills[Number(indexValue)] = skill;
      } else {
        state.portfolio.skills.push(skill);
      }
      await savePortfolio("skills", "Skills saved.");
      resetSkillForm();
    } catch (error) {
      showStatus("skills", error.message, true);
    }
  });

  $("#cert-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const id = $("#cert-id").value || slugify($("#cert-name").value, "cert");
      const certification = {
        id,
        name: $("#cert-name").value,
        issuer: $("#cert-issuer").value,
        year: $("#cert-year").value
      };
      const index = state.portfolio.certifications.findIndex((item) => item.id === id);
      if (index >= 0) {
        state.portfolio.certifications[index] = certification;
      } else {
        state.portfolio.certifications.push(certification);
      }
      await savePortfolio("certs", "Certification saved.");
      resetCertForm();
    } catch (error) {
      showStatus("certs", error.message, true);
    }
  });

  $("#project-reset").addEventListener("click", resetProjectForm);
  $("#skill-reset").addEventListener("click", resetSkillForm);
  $("#cert-reset").addEventListener("click", resetCertForm);
}

async function init() {
  setupTabs();
  setupForms();
  const session = await api("/api/admin/session");
  state.csrfToken = session.csrfToken;
  state.portfolio = await api("/api/admin/portfolio");
  state.messages = await api("/api/admin/messages");
  renderAll();
  renderMessages();

  $("#logout-button").addEventListener("click", async () => {
    await api("/admin/logout", { method: "POST" });
    window.location.assign("/admin");
  });
}

init().catch((error) => {
  document.body.replaceChildren(createElement("main", "auth-page", error.message));
});
