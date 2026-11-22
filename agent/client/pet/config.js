// 配置的单一读取点：读文件、填默认值、报告没有消费方的键。
// 判定、窗口、日志、钩子都向这里要值，默认值不再散落在调用点。
const fs = require('node:fs');

const { cachedJsonReader } = require('./storage');

const DEFAULTS = {
  port: 47900,
  window: { width: 240, height: 240, petSize: 170 },
  behavior: { alwaysOnTop: true, rememberPosition: true },
  thresholds: {
    consecutiveReads: 25,
    idleMinutes: 10,
    minCallsInWindow: 8,
    sessionIdleMinutes: 30
  },
  logs: { dir: 'logs', keepDays: 7 },
  toggles: { pet: true, systemMessage: true, agentNudge: true },
  nudge: { text: '', systemMessage: '' }
};

const SECTIONS = ['window', 'behavior', 'thresholds', 'logs', 'toggles', 'nudge'];

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function positiveNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function booleanOr(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

function textOr(value, fallback) {
  return typeof value === 'string' ? value : fallback;
}

// 纯函数：把原始 JSON 解析成填好默认值的配置，顺便报告多余的键。
// 多余键不是错误——但读代码的人会以为它有效，所以要出声。
function resolveConfig(raw, { warn = () => {}, source = 'pet.config.json' } = {}) {
  const given = isPlainObject(raw) ? raw : {};

  for (const key of Object.keys(given)) {
    if (!(key in DEFAULTS)) warn(`${source}: 未知配置键 "${key}"，已忽略`);
  }
  for (const section of SECTIONS) {
    if (!isPlainObject(given[section])) continue;
    for (const key of Object.keys(given[section])) {
      if (!(key in DEFAULTS[section])) warn(`${source}: 未知配置键 "${section}.${key}"，已忽略`);
    }
  }

  const window = isPlainObject(given.window) ? given.window : {};
  const behavior = isPlainObject(given.behavior) ? given.behavior : {};
  const thresholds = isPlainObject(given.thresholds) ? given.thresholds : {};
  const logs = isPlainObject(given.logs) ? given.logs : {};
  const toggles = isPlainObject(given.toggles) ? given.toggles : {};
  const nudge = isPlainObject(given.nudge) ? given.nudge : {};

  return {
    port: positiveNumber(given.port, DEFAULTS.port),
    window: {
      width: positiveNumber(window.width, DEFAULTS.window.width),
      height: positiveNumber(window.height, DEFAULTS.window.height),
      petSize: positiveNumber(window.petSize, DEFAULTS.window.petSize)
    },
    behavior: {
      alwaysOnTop: booleanOr(behavior.alwaysOnTop, DEFAULTS.behavior.alwaysOnTop),
      rememberPosition: booleanOr(behavior.rememberPosition, DEFAULTS.behavior.rememberPosition)
    },
    thresholds: {
      consecutiveReads: positiveNumber(
        thresholds.consecutiveReads,
        DEFAULTS.thresholds.consecutiveReads
      ),
      idleMinutes: positiveNumber(thresholds.idleMinutes, DEFAULTS.thresholds.idleMinutes),
      minCallsInWindow: positiveNumber(
        thresholds.minCallsInWindow,
        DEFAULTS.thresholds.minCallsInWindow
      ),
      sessionIdleMinutes: positiveNumber(
        thresholds.sessionIdleMinutes,
        DEFAULTS.thresholds.sessionIdleMinutes
      )
    },
    logs: {
      dir: textOr(logs.dir, DEFAULTS.logs.dir),
      keepDays: positiveNumber(logs.keepDays, DEFAULTS.logs.keepDays)
    },
    toggles: {
      pet: booleanOr(toggles.pet, DEFAULTS.toggles.pet),
      systemMessage: booleanOr(toggles.systemMessage, DEFAULTS.toggles.systemMessage),
      agentNudge: booleanOr(toggles.agentNudge, DEFAULTS.toggles.agentNudge)
    },
    nudge: {
      text: textOr(nudge.text, DEFAULTS.nudge.text),
      systemMessage: textOr(nudge.systemMessage, DEFAULTS.nudge.systemMessage)
    }
  };
}

// 热读：文件改坏时沿用上一份，键的警告只报一次。
function createConfigLoader(filePath, { warn = (message) => console.warn(message) } = {}) {
  const readRaw = cachedJsonReader(filePath);
  const warned = new Set();
  let lastRaw = null;
  let last = null;

  return function read() {
    const raw = readRaw();
    if (last !== null && raw === lastRaw) return last;
    last = resolveConfig(raw, {
      source: filePath,
      warn: (message) => {
        if (warned.has(message)) return;
        warned.add(message);
        warn(message);
      }
    });
    lastRaw = raw;
    return last;
  };
}

// 钩子进程用：端口必须与桌宠一致，所以同样从配置文件读。
// 钩子的契约是「桌宠不在时要像不存在一样」，所以任何失败都静默回落。
function readPort(filePath) {
  const fromEnv = Number(process.env.PET_PORT);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
  try {
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^﻿/, ''));
    const port = Number(raw && raw.port);
    if (Number.isFinite(port) && port > 0) return port;
  } catch {
    // 配置文件不在或坏了
  }
  return DEFAULTS.port;
}

module.exports = { DEFAULTS, createConfigLoader, readPort, resolveConfig };
