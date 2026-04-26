"use strict";

const fs = require("fs/promises");
const path = require("path");
const { normalizePortfolio } = require("./validation");

const rootDir = path.resolve(__dirname, "..");

function resolveDataPath(config, fileName) {
  return path.resolve(rootDir, config.dataDir, fileName);
}

async function readJson(filePath, fallback) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}

async function writeJsonAtomic(filePath, value) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tempPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await fs.rename(tempPath, filePath);
}

function createStorage(config) {
  const portfolioPath = resolveDataPath(config, "portfolio.json");
  const messagesPath = resolveDataPath(config, "messages.json");
  let portfolioQueue = Promise.resolve();
  let messageQueue = Promise.resolve();

  async function getPortfolio() {
    const data = await readJson(portfolioPath, {});
    return normalizePortfolio(data);
  }

  function savePortfolio(nextPortfolio) {
    portfolioQueue = portfolioQueue.then(async () => {
      const normalized = normalizePortfolio(nextPortfolio);
      await writeJsonAtomic(portfolioPath, normalized);
      return normalized;
    });
    return portfolioQueue;
  }

  async function getMessages() {
    const messages = await readJson(messagesPath, []);
    return Array.isArray(messages) ? messages : [];
  }

  function addMessage(message) {
    messageQueue = messageQueue.then(async () => {
      const messages = await getMessages();
      const nextMessages = [message, ...messages].slice(0, 250);
      await writeJsonAtomic(messagesPath, nextMessages);
      return message;
    });
    return messageQueue;
  }

  function deleteMessage(id) {
    messageQueue = messageQueue.then(async () => {
      const messages = await getMessages();
      const nextMessages = messages.filter((message) => message.id !== id);
      await writeJsonAtomic(messagesPath, nextMessages);
      return nextMessages;
    });
    return messageQueue;
  }

  return {
    addMessage,
    deleteMessage,
    getMessages,
    getPortfolio,
    savePortfolio
  };
}

module.exports = {
  createStorage
};
