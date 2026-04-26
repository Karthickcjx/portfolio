"use strict";

const crypto = require("crypto");

const DEFAULT_PARAMS = Object.freeze({
  N: 16384,
  r: 8,
  p: 1,
  keyLength: 64
});

function isStrongPassword(password) {
  return (
    typeof password === "string" &&
    password.length >= 14 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

function scryptAsync(password, salt, params = DEFAULT_PARAMS) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(
      password,
      salt,
      params.keyLength,
      {
        N: params.N,
        r: params.r,
        p: params.p,
        maxmem: 64 * 1024 * 1024
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(derivedKey);
      }
    );
  });
}

async function hashPassword(password) {
  if (!isStrongPassword(password)) {
    throw new Error(
      "Password must be at least 14 characters and include uppercase, lowercase, number, and symbol."
    );
  }

  const salt = crypto.randomBytes(24).toString("base64url");
  const derivedKey = await scryptAsync(password, salt);
  const params = DEFAULT_PARAMS;

  return [
    "scrypt",
    params.N,
    params.r,
    params.p,
    params.keyLength,
    salt,
    derivedKey.toString("base64url")
  ].join("$");
}

async function verifyPassword(password, storedHash) {
  if (typeof password !== "string" || typeof storedHash !== "string") {
    return false;
  }

  const parts = storedHash.split("$");
  if (parts.length !== 7 || parts[0] !== "scrypt") {
    return false;
  }

  const params = {
    N: Number(parts[1]),
    r: Number(parts[2]),
    p: Number(parts[3]),
    keyLength: Number(parts[4])
  };
  const salt = parts[5];
  const expected = Buffer.from(parts[6], "base64url");

  if (
    !Number.isSafeInteger(params.N) ||
    !Number.isSafeInteger(params.r) ||
    !Number.isSafeInteger(params.p) ||
    !Number.isSafeInteger(params.keyLength) ||
    expected.length !== params.keyLength
  ) {
    return false;
  }

  const actual = await scryptAsync(password, salt, params);
  if (actual.length !== expected.length) {
    return false;
  }

  return crypto.timingSafeEqual(actual, expected);
}

module.exports = {
  hashPassword,
  isStrongPassword,
  verifyPassword
};
