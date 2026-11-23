"use strict";

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function renderPortfolioPage(template, portfolio) {
  const { profile, projects, experience, skills, certifications } = portfolio;
  const e = escapeHtml;
  function content(id, html) {
    const pattern = new RegExp(`(<([a-z]+)[^>]* id="${id}"[^>]*>)[\\s\\S]*?(</\\2>)`);
    template = template.replace(pattern, (_match, open, _tag, close) => open + html + close);
  }
  template = template.replace(/<title>.*?<\/title>/, () => `<title>${e(profile.name)} - ${e(profile.role)}</title>`);
  template = template.replace(/<img id="profile-avatar"[^>]*>/, () => `<img id="profile-avatar" class="avatar" src="${e(profile.avatar)}" alt="${e(profile.name)}">`);
  content("profile-name", e(profile.name));
  content("typed-role", e(profile.roles[0] || profile.role));
  content("hero-summary", e(profile.heroSummary));
  content("about-copy", profile.bio.map((text) => `<p>${e(text)}</p>`).join(""));
  content("about-badges", profile.badges.map((text) => `<span class="badge">${e(text)}</span>`).join(""));
  content("hero-stats", profile.stats.map((stat) => `<div class="stat-card"><span class="stat-value">${e(stat.value)}${e(stat.suffix)}</span><span class="stat-label">${e(stat.label)}</span></div>`).join(""));
  content("profile-phone", e(profile.phone));
  content("contact-phone", e(profile.phone));
  content("profile-education", e(profile.education));
  content("footer-text", e(profile.footer));
  for (const [key, url, label] of [["email", `mailto:${profile.email}`, profile.email], ...["linkedin", "github", "website"].map((key) => [key, profile[key], profile[key]])]) {
    for (const prefix of ["profile", "contact"]) {
      const id = `${prefix}-${key}`;
      template = template.replace(new RegExp(`<a id="${id}"[^>]*>[\\s\\S]*?</a>`), () => `<a id="${id}"${prefix === "contact" ? ' class="contact-row"' : ""} href="${e(url || "#")}">${prefix === "contact" ? `<span>${e(key)}</span><strong>${e(label)}</strong>` : e(label)}</a>`);
    }
  }
  const chips = (items) => `<div class="chip-list">${items.map((item) => `<span class="chip">${e(item)}</span>`).join("")}</div>`;
  const link = (url, label) => url && url !== "#" ? `<a class="card-link" href="${e(url)}">${label}</a>` : "";
  content("projects-grid", projects.map((item) => `<article class="project-card"><p class="card-meta">${e(item.date)}</p><h3 class="card-title">${e(item.title)}</h3><p class="project-description">${e(item.description)}</p>${chips(item.techs)}${link(item.url, "View Project")}</article>`).join(""));
  content("experience-timeline", experience.map((item) => `<article class="experience-item"><h3 class="card-title">${e(item.role)}</h3><p>${e(item.organization)} ? ${e(item.date)}</p><p>${e(item.summary)}</p><ul>${item.highlights.map((text) => `<li>${e(text)}</li>`).join("")}</ul>${chips(item.techs)}${link(item.url, "View Details")}</article>`).join(""));
  content("skills-grid", skills.map((item) => `<article class="skill-card"><h3>${e(item.category)}</h3>${chips(item.items)}</article>`).join(""));
  content("cert-grid", certifications.map((item) => `<article class="cert-card"><h3>${e(item.name)}</h3><p>${e(item.issuer)} ? ${e(item.year)}</p></article>`).join(""));
  return template;
}

module.exports = { renderPortfolioPage };
