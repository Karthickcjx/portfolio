"use strict";

const form = document.querySelector("#login-form");
const statusElement = document.querySelector("#login-status");

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  statusElement.classList.remove("is-error");
  statusElement.textContent = "Checking credentials...";

  const payload = {
    username: document.querySelector("#username").value,
    password: document.querySelector("#password").value
  };

  try {
    const response = await fetch("/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(result.error || "Unable to sign in.");
    }
    window.location.assign(result.redirect || "/admin/dashboard");
  } catch (error) {
    statusElement.classList.add("is-error");
    statusElement.textContent = error.message;
  }
});
