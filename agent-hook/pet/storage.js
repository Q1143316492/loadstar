// 配置热读（1 秒缓存）与每会话 JSONL 日志。
const fs = require('node:fs');
const path = require('node:path');

function cachedJsonReader(filePath, ttlMs = 1000) {
  let cache = null;
  let cachedAt = 0;
  let fallback = null;

  return function read() {
    const now = Date.now();
    if (cache && now - cachedAt < ttlMs) return cache;
    try {
      cache = JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^﻿/, ''));
      cachedAt = now;
      if (fallback === null) fallback = cache;
      return cache;
    } catch (err) {
      // 改坏了就沿用上一次成功读到的内容，别让桌宠因为一个笔误停摆。
      if (cache) return cache;
      if (fallback) return fallback;
      console.error(`读取 ${path.basename(filePath)} 失败：`, err.message);
      return {};
    }
  };
}

function cleanupOldLogs(dir, keepDays) {
  const cutoff = Date.now() - keepDays * 24 * 3600 * 1000;
  let entries = [];
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (!name.endsWith('.jsonl')) continue;
    const file = path.join(dir, name);
    try {
      if (fs.statSync(file).mtimeMs < cutoff) fs.unlinkSync(file);
    } catch {
      // 单个文件删不掉不影响启动
    }
  }
}

function createLogger(dir) {
  fs.mkdirSync(dir, { recursive: true });
  const streams = new Map();

  function open(sessionId) {
    let stream = streams.get(sessionId);
    if (!stream) {
      const safe = String(sessionId).replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80);
      stream = fs.createWriteStream(path.join(dir, `${safe}.jsonl`), { flags: 'a' });
      stream.on('error', () => {});
      streams.set(sessionId, stream);
    }
    return stream;
  }

  return {
    write(sessionId, record) {
      try {
        open(sessionId).write(JSON.stringify(record) + '\n');
      } catch {
        // 日志失败不阻塞
      }
    },
    close() {
      for (const s of streams.values()) {
        try { s.end(); } catch {}
      }
      streams.clear();
    }
  };
}

module.exports = { cachedJsonReader, createLogger, cleanupOldLogs };
